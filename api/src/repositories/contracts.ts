import type {
  AuthSession,
  Book,
  GoalPeriod,
  GoalType,
  ReadingGoal,
  ReadingSession,
  ReadingSessionWithBook,
  ReadingStatus,
  User,
  UserBook,
  UserBookWithBook,
} from '../domain/entities';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export interface AuthSessionRepository {
  create(data: { id: string; userId: string; expiresAt: Date }): Promise<AuthSession>;
  findById(id: string): Promise<AuthSession | null>;
  revoke(id: string): Promise<void>;
}

export interface BookData {
  title: string;
  authors: string;
  publisher: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  isbn: string | null;
  externalSource: string | null;
  externalId: string | null;
  createdByUserId: string | null;
}

export interface BookRepository {
  findById(id: string): Promise<Book | null>;
  findByExternalId(source: string, externalId: string): Promise<Book | null>;
  create(data: BookData): Promise<Book>;
  update(id: string, data: Partial<BookData>): Promise<Book>;
}

export interface LibraryFilters {
  status?: ReadingStatus;
  query?: string;
  favoritesOnly?: boolean;
}

export interface UserBookData {
  status: ReadingStatus;
  totalPages: number;
  currentPage: number;
  rating: number | null;
  isFavorite: boolean;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface UserBookRepository {
  list(userId: string, filters?: LibraryFilters): Promise<UserBookWithBook[]>;
  findById(userId: string, id: string): Promise<UserBookWithBook | null>;
  findByBook(userId: string, bookId: string): Promise<UserBook | null>;
  create(userId: string, bookId: string, data: UserBookData): Promise<UserBookWithBook>;
  update(
    userId: string,
    id: string,
    data: Partial<UserBookData> & { bookId?: string },
  ): Promise<UserBookWithBook>;
  delete(userId: string, id: string): Promise<void>;
}

export interface ReadingSessionData {
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes: number;
  readAt: Date;
  note: string | null;
}

export interface ReadingSessionFilters {
  userBookId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface ReadingSessionRepository {
  list(userId: string, filters: ReadingSessionFilters): Promise<ReadingSessionWithBook[]>;
  findById(userId: string, id: string): Promise<ReadingSession | null>;
  create(userId: string, data: ReadingSessionData): Promise<ReadingSession>;
  update(userId: string, id: string, data: Partial<ReadingSessionData>): Promise<ReadingSession>;
  delete(userId: string, id: string): Promise<void>;
  maxEndPage(userId: string, userBookId: string): Promise<number | null>;
}

export interface ReadingGoalData {
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: Date;
  endDate: Date;
}

export interface ReadingGoalRepository {
  list(userId: string): Promise<ReadingGoal[]>;
  findById(userId: string, id: string): Promise<ReadingGoal | null>;
  create(userId: string, data: ReadingGoalData): Promise<ReadingGoal>;
  update(userId: string, id: string, data: Partial<ReadingGoalData>): Promise<ReadingGoal>;
  delete(userId: string, id: string): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  authSessions: AuthSessionRepository;
  books: BookRepository;
  userBooks: UserBookRepository;
  readingSessions: ReadingSessionRepository;
  readingGoals: ReadingGoalRepository;
}
