export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'FINISHED' | 'PAUSED' | 'ABANDONED';
export type GoalType = 'BOOKS_FINISHED' | 'PAGES_READ' | 'MINUTES_READ' | 'READING_DAYS';
export type GoalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type GoalState = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface CatalogBookInfo {
  id: string;
  title: string;
  authors: string;
  publisher: string | null;
  coverUrl: string | null;
  isbn: string | null;
  externalSource: string | null;
  externalId: string | null;
}

export interface LibraryItem {
  id: string;
  status: ReadingStatus;
  totalPages: number;
  currentPage: number;
  progress: number;
  rating: number | null;
  isFavorite: boolean;
  review: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  book: CatalogBookInfo;
}

export interface LibraryItemInput {
  title: string;
  authors: string;
  publisher?: string | null;
  coverUrl?: string | null;
  isbn?: string | null;
  externalSource?: 'openlibrary' | null;
  externalId?: string | null;
  totalPages: number;
  currentPage: number;
  status?: ReadingStatus;
  isFavorite: boolean;
  rating?: number | null;
  review?: string | null;
}

export type LibraryItemUpdate = Partial<Omit<LibraryItemInput, 'externalSource' | 'externalId'>>;

export type LibrarySortField = 'title' | 'updatedAt' | 'createdAt' | 'progress' | 'rating';

export interface LibraryQuery {
  status?: ReadingStatus;
  q?: string;
  favorites?: boolean;
  sort?: LibrarySortField;
  order?: 'asc' | 'desc';
}

export interface ReadingSession {
  id: string;
  userBookId: string;
  bookTitle?: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationMinutes: number;
  readAt: string;
  note: string | null;
  createdAt: string;
}

export interface ReadingSessionInput {
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes: number;
  readAt: string;
  note?: string | null;
}

export type ReadingSessionUpdate = Partial<Omit<ReadingSessionInput, 'userBookId'>>;

export interface ReadingGoal {
  id: string;
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string;
  currentValue: number;
  percentage: number;
  state: GoalState;
  createdAt: string;
}

export interface ReadingGoalInput {
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string;
}

export interface ReadingSummary {
  booksFinished: number;
  pagesRead: number;
  minutesRead: number;
  readingDays: number;
}

export type RecentActivity =
  | {
      type: 'SESSION';
      id: string;
      userBookId: string;
      bookTitle: string;
      pagesRead: number;
      durationMinutes: number;
      occurredAt: string;
    }
  | { type: 'FINISHED'; id: string; userBookId: string; bookTitle: string; occurredAt: string };

export interface StatisticsOverview {
  year: number;
  thisYear: ReadingSummary;
  allTime: ReadingSummary;
  totalBooks: number;
  readingNowCount: number;
  statusDistribution: Record<ReadingStatus, number>;
  annualGoal: ReadingGoal | null;
  goals: { total: number; active: number; completed: number };
  continueReading: LibraryItem[];
  recentActivity: RecentActivity[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}
