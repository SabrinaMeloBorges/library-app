import { isWithinRange, toDayKey, yearRangeOf, type DayRange } from '../domain/calendar';
import {
  READING_STATUSES,
  type ReadingSessionWithBook,
  type ReadingStatus,
  type UserBookWithBook,
} from '../domain/entities';
import { goalRange } from '../domain/goalProgress';
import { pagesInSession, summarizeRange, type ReadingSummary } from '../domain/readingMetrics';
import type { GoalWithProgress, ReadingGoalService } from './readingGoalService';
import type { ReadingGoalRepository } from '../repositories/contracts';

const CONTINUE_READING_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const ALL_TIME: DayRange = { start: '0000-01-01', end: '9999-12-31' };

export type RecentActivity =
  | {
      type: 'SESSION';
      id: string;
      userBookId: string;
      bookTitle: string;
      pagesRead: number;
      durationMinutes: number;
      occurredAt: Date;
    }
  | { type: 'FINISHED'; id: string; userBookId: string; bookTitle: string; occurredAt: Date };

export interface StatisticsOverview {
  year: number;
  thisYear: ReadingSummary;
  allTime: ReadingSummary;
  totalBooks: number;
  readingNowCount: number;
  statusDistribution: Record<ReadingStatus, number>;
  annualGoal: GoalWithProgress | null;
  goals: { total: number; active: number; completed: number };
  continueReading: UserBookWithBook[];
  recentActivity: RecentActivity[];
}

const countByStatus = (userBooks: UserBookWithBook[]): Record<ReadingStatus, number> => {
  const distribution = Object.fromEntries(READING_STATUSES.map((status) => [status, 0])) as Record<
    ReadingStatus,
    number
  >;
  for (const userBook of userBooks) distribution[userBook.status] += 1;
  return distribution;
};

const buildRecentActivity = (
  sessions: ReadingSessionWithBook[],
  userBooks: UserBookWithBook[],
): RecentActivity[] => {
  const sessionActivity: RecentActivity[] = sessions
    .slice(0, RECENT_ACTIVITY_LIMIT)
    .map((session) => ({
      type: 'SESSION',
      id: session.id,
      userBookId: session.userBookId,
      bookTitle: session.bookTitle,
      pagesRead: pagesInSession(session),
      durationMinutes: session.durationMinutes,
      occurredAt: session.readAt,
    }));
  const finishedActivity: RecentActivity[] = userBooks
    .filter((userBook) => userBook.status === 'FINISHED' && userBook.finishedAt)
    .map((userBook) => ({
      type: 'FINISHED',
      id: `finished-${userBook.id}`,
      userBookId: userBook.id,
      bookTitle: userBook.book.title,
      occurredAt: userBook.finishedAt as Date,
    }));
  return [...sessionActivity, ...finishedActivity]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);
};

const pickAnnualGoal = (goals: GoalWithProgress[], today: string): GoalWithProgress | null => {
  const yearly = goals.filter(
    (goal) => goal.period === 'YEARLY' && isWithinRange(today, goalRange(goal)),
  );
  return yearly.find((goal) => goal.type === 'BOOKS_FINISHED') ?? yearly[0] ?? null;
};

export class StatisticsService {
  constructor(
    private readonly goalRepository: ReadingGoalRepository,
    private readonly goalService: ReadingGoalService,
    private readonly timeZone: string,
  ) {}

  async overview(userId: string): Promise<StatisticsOverview> {
    const now = new Date();
    const [snapshot, goals] = await Promise.all([
      this.goalService.loadSnapshot(userId),
      this.goalRepository.list(userId),
    ]);
    const { sessions, userBooks } = snapshot;
    const goalsWithProgress = goals.map((goal) => this.goalService.withProgress(goal, snapshot));
    const yearRange = yearRangeOf(now, this.timeZone);

    return {
      year: Number(yearRange.start.slice(0, 4)),
      thisYear: summarizeRange(snapshot, yearRange, this.timeZone),
      allTime: summarizeRange(snapshot, ALL_TIME, this.timeZone),
      totalBooks: userBooks.length,
      readingNowCount: userBooks.filter((userBook) => userBook.status === 'READING').length,
      statusDistribution: countByStatus(userBooks),
      annualGoal: pickAnnualGoal(goalsWithProgress, toDayKey(now, this.timeZone)),
      goals: {
        total: goalsWithProgress.length,
        active: goalsWithProgress.filter((goal) => goal.progress.state === 'ACTIVE').length,
        completed: goalsWithProgress.filter((goal) => goal.progress.state === 'COMPLETED').length,
      },
      continueReading: userBooks
        .filter((userBook) => userBook.status === 'READING')
        .slice(0, CONTINUE_READING_LIMIT),
      recentActivity: buildRecentActivity(sessions, userBooks),
    };
  }
}
