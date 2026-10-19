export interface CatalogBook {
  externalSource: 'openlibrary';
  externalId: string;
  title: string;
  authors: string;
  publisher: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  isbn: string | null;
}

export class CatalogUnavailableError extends Error {
  constructor(message = 'O catálogo de livros está indisponível no momento.') {
    super(message);
    this.name = 'CatalogUnavailableError';
  }
}

const SEARCH_URL = 'https://openlibrary.org/search.json';
const COVER_URL = 'https://covers.openlibrary.org/b/id';
const RESULT_LIMIT = 20;
const FIELDS = 'key,title,author_name,publisher,number_of_pages_median,cover_i,isbn';
const WORK_KEY_PATTERN = /^\/works\/OL\d+W$/;
const MAX_TEXT_LENGTH = 255;

interface OpenLibraryDoc {
  key?: unknown;
  title?: unknown;
  author_name?: unknown;
  publisher?: unknown;
  number_of_pages_median?: unknown;
  cover_i?: unknown;
  isbn?: unknown;
}

const firstString = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const found = value.find(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
  return found ? found.trim().slice(0, MAX_TEXT_LENGTH) : null;
};

const joinStrings = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const names = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
  return names.length > 0 ? names.slice(0, 3).join(', ').slice(0, MAX_TEXT_LENGTH) : null;
};

const positiveInteger = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;

const pickIsbn = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const isbn = value.find(
    (item): item is string => typeof item === 'string' && /^(\d{13}|\d{9}[\dX])$/.test(item),
  );
  return isbn ?? null;
};

export const parseCatalogDoc = (doc: OpenLibraryDoc): CatalogBook | null => {
  if (typeof doc.key !== 'string' || !WORK_KEY_PATTERN.test(doc.key)) return null;
  if (typeof doc.title !== 'string' || doc.title.trim().length === 0) return null;
  const authors = joinStrings(doc.author_name);
  if (!authors) return null;
  const coverId = positiveInteger(doc.cover_i);

  return {
    externalSource: 'openlibrary',
    externalId: doc.key.slice(1),
    title: doc.title.trim().slice(0, MAX_TEXT_LENGTH),
    authors,
    publisher: firstString(doc.publisher),
    pageCount: positiveInteger(doc.number_of_pages_median),
    coverUrl: coverId ? `${COVER_URL}/${coverId}-M.jpg` : null,
    isbn: pickIsbn(doc.isbn),
  };
};

export interface WorkDetails {
  description: string | null;
  subjects: string | null;
}

const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_SUBJECTS = 3;

const requestJson = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new CatalogUnavailableError('Sem conexão com o catálogo. Verifique sua internet.');
  }
  if (!response.ok) throw new CatalogUnavailableError();
  return response.json().catch(() => null);
};

const parseDocs = (body: unknown): CatalogBook[] => {
  const docs = (body as { docs?: unknown })?.docs;
  if (!Array.isArray(docs)) throw new CatalogUnavailableError('Resposta inesperada do catálogo.');
  const seen = new Set<string>();
  return docs
    .map((doc) => parseCatalogDoc(doc as OpenLibraryDoc))
    .filter((book): book is CatalogBook => {
      if (!book || seen.has(book.externalId)) return false;
      seen.add(book.externalId);
      return true;
    });
};

const searchWith = async (
  criteria: Record<string, string>,
  signal?: AbortSignal,
): Promise<CatalogBook[]> => {
  const params = new URLSearchParams({ ...criteria, fields: FIELDS, limit: String(RESULT_LIMIT) });
  return parseDocs(await requestJson(`${SEARCH_URL}?${params.toString()}`, signal));
};

export const parseWorkDetails = (body: unknown): WorkDetails => {
  const work = (body ?? {}) as { description?: unknown; subjects?: unknown };
  const rawDescription =
    typeof work.description === 'string'
      ? work.description
      : typeof (work.description as { value?: unknown })?.value === 'string'
        ? (work.description as { value: string }).value
        : null;
  const subjects = Array.isArray(work.subjects)
    ? work.subjects
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, MAX_SUBJECTS)
        .join(', ')
        .slice(0, MAX_TEXT_LENGTH)
    : '';
  return {
    description: rawDescription?.trim().slice(0, MAX_DESCRIPTION_LENGTH) || null,
    subjects: subjects || null,
  };
};

export const catalogService = {
  search(term: string, signal?: AbortSignal): Promise<CatalogBook[]> {
    return searchWith({ q: term }, signal);
  },

  searchBySubject(subject: string, signal?: AbortSignal): Promise<CatalogBook[]> {
    return searchWith({ subject }, signal);
  },

  async workDetails(externalId: string): Promise<WorkDetails> {
    if (!/^works\/OL\d+W$/.test(externalId)) return { description: null, subjects: null };
    return parseWorkDetails(await requestJson(`https://openlibrary.org/${externalId}.json`));
  },
};
