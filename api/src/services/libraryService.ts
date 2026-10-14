import type { Book, UserBookWithBook } from '../domain/entities';
import { progressPercentage, resolveProgress } from '../domain/readingProgress';
import { AppError } from '../errors/AppError';
import type { BookData, BookRepository, UserBookRepository } from '../repositories/contracts';
import type {
  CreateLibraryItemInput,
  LibraryQuery,
  UpdateLibraryItemInput,
} from '../validators/libraryValidators';
import type { EngagementHooks } from './engagementService';

const NOT_FOUND_MESSAGE = 'Livro não encontrado na sua biblioteca';

type BookEditableFields = Pick<
  UpdateLibraryItemInput,
  'title' | 'authors' | 'publisher' | 'coverUrl' | 'isbn'
>;

const compareText = (a: string, b: string): number =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

const SORTERS: Record<LibraryQuery['sort'], (a: UserBookWithBook, b: UserBookWithBook) => number> =
  {
    title: (a, b) => compareText(a.book.title, b.book.title),
    updatedAt: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
    createdAt: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    progress: (a, b) =>
      progressPercentage(a.currentPage, a.totalPages) -
      progressPercentage(b.currentPage, b.totalPages),
    rating: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
  };

const BOOK_EDITABLE_FIELDS: (keyof BookEditableFields)[] = [
  'title',
  'authors',
  'publisher',
  'coverUrl',
  'isbn',
];

const pickBookChanges = (input: UpdateLibraryItemInput, current: Book): Partial<BookData> => {
  const changes: Partial<BookData> = {};
  for (const field of BOOK_EDITABLE_FIELDS) {
    const value = input[field];
    if (value !== undefined && value !== current[field]) Object.assign(changes, { [field]: value });
  }
  return changes;
};

export class LibraryService {
  constructor(
    private readonly books: BookRepository,
    private readonly userBooks: UserBookRepository,
    private readonly engagement: EngagementHooks,
  ) {}

  async list(userId: string, query: LibraryQuery): Promise<UserBookWithBook[]> {
    const items = await this.userBooks.list(userId, {
      status: query.status,
      query: query.q,
      favoritesOnly: query.favorites,
    });
    const direction = query.order === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => SORTERS[query.sort](a, b) * direction);
  }

  async get(userId: string, id: string): Promise<UserBookWithBook> {
    const item = await this.userBooks.findById(userId, id);
    if (!item) throw AppError.notFound(NOT_FOUND_MESSAGE);
    return item;
  }

  async create(userId: string, input: CreateLibraryItemInput): Promise<UserBookWithBook> {
    const book = await this.resolveCatalogBook(userId, input);
    const alreadyInLibrary = await this.userBooks.findByBook(userId, book.id);
    if (alreadyInLibrary) throw AppError.conflict('Este livro já está na sua biblioteca');

    const progress = resolveProgress(
      {
        status: 'WANT_TO_READ',
        currentPage: 0,
        totalPages: input.totalPages,
        startedAt: null,
        finishedAt: null,
      },
      { status: input.status, currentPage: input.currentPage },
      new Date(),
    );

    const created = await this.userBooks.create(userId, book.id, {
      ...progress,
      rating: input.rating ?? null,
      isFavorite: input.isFavorite,
      review: input.review ?? null,
    });
    await this.engagement.bookChanged(userId, null, created);
    return created;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateLibraryItemInput,
  ): Promise<UserBookWithBook> {
    const current = await this.get(userId, id);
    const totalPages = input.totalPages ?? current.totalPages;
    const currentPage = input.currentPage ?? current.currentPage;
    if (currentPage > totalPages) {
      throw AppError.validation('A página atual não pode ser maior que o total de páginas', [
        {
          field: 'currentPage',
          message: 'A página atual não pode ser maior que o total de páginas',
        },
      ]);
    }

    const bookId = await this.applyBookChanges(
      userId,
      current,
      pickBookChanges(input, current.book),
    );
    const progress = resolveProgress(
      current,
      { status: input.status, currentPage: input.currentPage, totalPages: input.totalPages },
      new Date(),
    );

    const updated = await this.userBooks.update(userId, id, {
      ...progress,
      ...(bookId !== current.bookId ? { bookId } : {}),
      ...(input.isFavorite !== undefined ? { isFavorite: input.isFavorite } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.review !== undefined ? { review: input.review } : {}),
    });
    await this.engagement.bookChanged(userId, current, updated);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.userBooks.delete(userId, id);
  }

  private async resolveCatalogBook(userId: string, input: CreateLibraryItemInput): Promise<Book> {
    const bookData: BookData = {
      title: input.title,
      authors: input.authors,
      publisher: input.publisher ?? null,
      coverUrl: input.coverUrl ?? null,
      isbn: input.isbn ?? null,
      description: input.description ?? null,
      subjects: input.subjects ?? null,
      pageCount: input.totalPages,
      externalSource: input.externalSource ?? null,
      externalId: input.externalId ?? null,
      createdByUserId: null,
    };

    if (bookData.externalSource && bookData.externalId) {
      const existing = await this.books.findByExternalId(
        bookData.externalSource,
        bookData.externalId,
      );
      if (!existing) return this.books.create(bookData);
      const missingDetails = {
        ...(!existing.description && bookData.description
          ? { description: bookData.description }
          : {}),
        ...(!existing.subjects && bookData.subjects ? { subjects: bookData.subjects } : {}),
      };
      return Object.keys(missingDetails).length > 0
        ? this.books.update(existing.id, missingDetails)
        : existing;
    }
    return this.books.create({ ...bookData, createdByUserId: userId });
  }

  private async applyBookChanges(
    userId: string,
    current: UserBookWithBook,
    changes: Partial<BookData>,
  ): Promise<string> {
    if (Object.keys(changes).length === 0) return current.bookId;

    if (current.book.createdByUserId === userId) {
      await this.books.update(current.bookId, changes);
      return current.bookId;
    }

    const { id: _id, ...sharedBook } = current.book;
    const personalCopy = await this.books.create({
      ...sharedBook,
      ...changes,
      externalSource: null,
      externalId: null,
      createdByUserId: userId,
    });
    return personalCopy.id;
  }
}
