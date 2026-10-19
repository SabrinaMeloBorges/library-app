import { useCallback, useEffect, useState } from 'react';
import { catalogService, type CatalogBook } from '../services/catalogService';
import { useDebouncedValue } from './useDebouncedValue';

export const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_MS = 500;

export type BookSearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface BookSearchState {
  query: string;
  setQuery: (value: string) => void;
  results: CatalogBook[];
  status: BookSearchStatus;
  error: string | null;
  retry: () => void;
}

interface SearchOutcome {
  key: string;
  results: CatalogBook[];
  error: string | null;
}

interface SearchCriterion {
  kind: 'term' | 'subject';
  value: string;
}

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

const resolveCriterion = (term: string, subject?: string): SearchCriterion | null => {
  if (term.length >= MIN_SEARCH_LENGTH) return { kind: 'term', value: term };
  if (term.length === 0 && subject) return { kind: 'subject', value: subject };
  return null;
};

const resolveStatus = (
  criterion: SearchCriterion | null,
  key: string,
  outcome: SearchOutcome | null,
): BookSearchStatus => {
  if (!criterion) return 'idle';
  if (!outcome || outcome.key !== key) return 'loading';
  if (outcome.error) return 'error';
  return outcome.results.length > 0 ? 'success' : 'empty';
};

const runSearch = (criterion: SearchCriterion, signal: AbortSignal): Promise<CatalogBook[]> =>
  criterion.kind === 'term'
    ? catalogService.search(criterion.value, signal)
    : catalogService.searchBySubject(criterion.value, signal);

export const useBookSearch = (
  debounceMs: number = DEBOUNCE_MS,
  subject?: string,
): BookSearchState => {
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const term = useDebouncedValue(query.trim(), debounceMs);
  const criterion = resolveCriterion(term, subject);
  const key = criterion ? `${criterion.kind}:${criterion.value}#${attempt}` : '';
  const criterionKind = criterion?.kind;
  const criterionValue = criterion?.value;

  useEffect(() => {
    if (!criterionKind || !criterionValue) return;
    const controller = new AbortController();
    runSearch({ kind: criterionKind, value: criterionValue }, controller.signal)
      .then((results) => setOutcome({ key, results, error: null }))
      .catch((caught: unknown) => {
        if (isAbortError(caught)) return;
        const message =
          caught instanceof Error ? caught.message : 'Não foi possível buscar livros.';
        setOutcome({ key, results: [], error: message });
      });
    return () => controller.abort();
  }, [criterionKind, criterionValue, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const status = resolveStatus(criterion, key, outcome);
  const isCurrent = outcome?.key === key;

  return {
    query,
    setQuery,
    results: status === 'success' && isCurrent ? outcome.results : [],
    status,
    error: status === 'error' && isCurrent ? outcome.error : null,
    retry,
  };
};
