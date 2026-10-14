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

export const catalogService = {
  async search(term: string, signal?: AbortSignal): Promise<CatalogBook[]> {
    const params = new URLSearchParams({ q: term, fields: FIELDS, limit: String(RESULT_LIMIT) });
    let response: Response;
    try {
      response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
        signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new CatalogUnavailableError('Sem conexão com o catálogo. Verifique sua internet.');
    }
    if (!response.ok) throw new CatalogUnavailableError();

    const body: unknown = await response.json().catch(() => null);
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
  },
};
