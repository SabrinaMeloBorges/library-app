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

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

const resolveStatus = (
  term: string,
  key: string,
  outcome: SearchOutcome | null,
): BookSearchStatus => {
  if (term.length < MIN_SEARCH_LENGTH) return 'idle';
  if (!outcome || outcome.key !== key) return 'loading';
  if (outcome.error) return 'error';
  return outcome.results.length > 0 ? 'success' : 'empty';
};

export const useBookSearch = (debounceMs: number = DEBOUNCE_MS): BookSearchState => {
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);
  const term = useDebouncedValue(query.trim(), debounceMs);
  const key = `${term}#${attempt}`;

  useEffect(() => {
    if (term.length < MIN_SEARCH_LENGTH) return;
    const controller = new AbortController();
    catalogService
      .search(term, controller.signal)
      .then((results) => setOutcome({ key, results, error: null }))
      .catch((caught: unknown) => {
        if (isAbortError(caught)) return;
        const message =
          caught instanceof Error ? caught.message : 'Não foi possível buscar livros.';
        setOutcome({ key, results: [], error: message });
      });
    return () => controller.abort();
  }, [term, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const status = resolveStatus(term, key, outcome);
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
