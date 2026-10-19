import type { ReadingSession, ReadingSessionWithBook, UserBookWithBook } from '../domain/entities';
import { toDateOnlyKey } from '../domain/calendar';
import { pagesInSession } from '../domain/readingMetrics';
import { progressPercentage } from '../domain/readingProgress';
import type { GoalWithProgress } from '../services/readingGoalService';
import type { StatisticsOverview } from '../services/statisticsService';

export const presentLibraryItem = (item: UserBookWithBook) => ({
  id: item.id,
  status: item.status,
  totalPages: item.totalPages,
  currentPage: item.currentPage,
  progress: progressPercentage(item.currentPage, item.totalPages),
  rating: item.rating,
  isFavorite: item.isFavorite,
  review: item.review,
  startedAt: item.startedAt,
  finishedAt: item.finishedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  book: {
    id: item.book.id,
    title: item.book.title,
    authors: item.book.authors,
    publisher: item.book.publisher,
    coverUrl: item.book.coverUrl,
    isbn: item.book.isbn,
    description: item.book.description,
    subjects: item.book.subjects,
    externalSource: item.book.externalSource,
    externalId: item.book.externalId,
  },
});

export const presentReadingSession = (session: ReadingSession | ReadingSessionWithBook) => ({
  id: session.id,
  userBookId: session.userBookId,
  bookTitle: 'bookTitle' in session ? session.bookTitle : undefined,
  startPage: session.startPage,
  endPage: session.endPage,
  pagesRead: pagesInSession(session),
  durationMinutes: session.durationMinutes,
  readAt: session.readAt,
  note: session.note,
  createdAt: session.createdAt,
});

export const presentGoal = (goal: GoalWithProgress) => ({
  id: goal.id,
  title: goal.title,
  type: goal.type,
  period: goal.period,
  targetValue: goal.targetValue,
  startDate: toDateOnlyKey(goal.startDate),
  endDate: toDateOnlyKey(goal.endDate),
  currentValue: goal.progress.currentValue,
  percentage: goal.progress.percentage,
  state: goal.progress.state,
  completedAt: goal.completedAt,
  createdAt: goal.createdAt,
});

export const presentOverview = (overview: StatisticsOverview) => ({
  ...overview,
  annualGoal: overview.annualGoal ? presentGoal(overview.annualGoal) : null,
  continueReading: overview.continueReading.map(presentLibraryItem),
});
