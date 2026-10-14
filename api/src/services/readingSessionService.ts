import type { ReadingSession, ReadingSessionWithBook, UserBookWithBook } from '../domain/entities';
import { resolveProgress } from '../domain/readingProgress';
import { AppError } from '../errors/AppError';
import type { ReadingSessionRepository, UserBookRepository } from '../repositories/contracts';
import type {
  CreateReadingSessionInput,
  ReadingSessionQuery,
  UpdateReadingSessionInput,
} from '../validators/readingSessionValidators';

const SESSION_NOT_FOUND = 'Sessão de leitura não encontrada';
const BOOK_NOT_FOUND = 'Livro não encontrado na sua biblioteca';

const assertWithinBook = (endPage: number, userBook: UserBookWithBook): void => {
  if (endPage > userBook.totalPages) {
    throw AppError.validation('A página final não pode ultrapassar o total de páginas do livro', [
      { field: 'endPage', message: `O livro possui ${userBook.totalPages} páginas` },
    ]);
  }
};

const assertPageOrder = (startPage: number, endPage: number): void => {
  if (endPage <= startPage) {
    throw AppError.validation('A página final deve ser maior que a página inicial', [
      { field: 'endPage', message: 'A página final deve ser maior que a página inicial' },
    ]);
  }
};

export class ReadingSessionService {
  constructor(
    private readonly sessions: ReadingSessionRepository,
    private readonly userBooks: UserBookRepository,
  ) {}

  list(userId: string, query: ReadingSessionQuery): Promise<ReadingSessionWithBook[]> {
    return this.sessions.list(userId, { userBookId: query.userBookId, limit: query.limit });
  }

  async create(userId: string, input: CreateReadingSessionInput): Promise<ReadingSession> {
    const userBook = await this.getUserBook(userId, input.userBookId);
    assertWithinBook(input.endPage, userBook);

    const session = await this.sessions.create(userId, {
      userBookId: input.userBookId,
      startPage: input.startPage,
      endPage: input.endPage,
      durationMinutes: input.durationMinutes,
      readAt: input.readAt,
      note: input.note ?? null,
    });

    if (input.endPage > userBook.currentPage) {
      await this.saveProgress(userId, userBook, input.endPage);
    }
    return session;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateReadingSessionInput,
  ): Promise<ReadingSession> {
    const current = await this.getSession(userId, id);
    const userBook = await this.getUserBook(userId, current.userBookId);
    const startPage = input.startPage ?? current.startPage;
    const endPage = input.endPage ?? current.endPage;
    assertPageOrder(startPage, endPage);
    assertWithinBook(endPage, userBook);

    const updated = await this.sessions.update(userId, id, input);
    await this.recalculateProgress(userId, userBook, current.endPage);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const current = await this.getSession(userId, id);
    const userBook = await this.getUserBook(userId, current.userBookId);
    await this.sessions.delete(userId, id);
    await this.recalculateProgress(userId, userBook, current.endPage);
  }

  private async recalculateProgress(
    userId: string,
    userBook: UserBookWithBook,
    previousEndPage: number,
  ): Promise<void> {
    const highestSessionPage = (await this.sessions.maxEndPage(userId, userBook.id)) ?? 0;
    const sessionDefinedProgress = previousEndPage >= userBook.currentPage;
    const nextPage = sessionDefinedProgress
      ? highestSessionPage
      : Math.max(userBook.currentPage, highestSessionPage);
    if (nextPage !== userBook.currentPage) {
      await this.saveProgress(userId, userBook, nextPage);
    }
  }

  private async saveProgress(
    userId: string,
    userBook: UserBookWithBook,
    currentPage: number,
  ): Promise<void> {
    const progress = resolveProgress(userBook, { currentPage }, new Date());
    await this.userBooks.update(userId, userBook.id, progress);
  }

  private async getSession(userId: string, id: string): Promise<ReadingSession> {
    const session = await this.sessions.findById(userId, id);
    if (!session) throw AppError.notFound(SESSION_NOT_FOUND);
    return session;
  }

  private async getUserBook(userId: string, userBookId: string): Promise<UserBookWithBook> {
    const userBook = await this.userBooks.findById(userId, userBookId);
    if (!userBook) throw AppError.notFound(BOOK_NOT_FOUND);
    return userBook;
  }
}
