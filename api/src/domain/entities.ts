export const READING_STATUSES = [
  'WANT_TO_READ',
  'READING',
  'FINISHED',
  'PAUSED',
  'ABANDONED',
] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const GOAL_TYPES = ['BOOKS_FINISHED', 'PAGES_READ', 'MINUTES_READ', 'READING_DAYS'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface Book {
  id: string;
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

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  totalPages: number;
  currentPage: number;
  rating: number | null;
  isFavorite: boolean;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBookWithBook extends UserBook {
  book: Book;
}

export interface ReadingSession {
  id: string;
  userId: string;
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes: number;
  readAt: Date;
  note: string | null;
  createdAt: Date;
}

export interface ReadingSessionWithBook extends ReadingSession {
  bookTitle: string;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}
