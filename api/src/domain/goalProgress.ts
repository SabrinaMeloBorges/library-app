import type { GoalType, ReadingGoal } from './entities';
import { toDateOnlyKey, toDayKey, type DayRange } from './calendar';
import { summarizeRange, type ReadingSnapshot, type ReadingSummary } from './readingMetrics';

export type GoalState = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface GoalProgress {
  currentValue: number;
  percentage: number;
  state: GoalState;
}

const VALUE_BY_TYPE: Record<GoalType, keyof ReadingSummary> = {
  BOOKS_FINISHED: 'booksFinished',
  PAGES_READ: 'pagesRead',
  MINUTES_READ: 'minutesRead',
  READING_DAYS: 'readingDays',
};

export const goalRange = (goal: Pick<ReadingGoal, 'startDate' | 'endDate'>): DayRange => ({
  start: toDateOnlyKey(goal.startDate),
  end: toDateOnlyKey(goal.endDate),
});

const resolveState = (range: DayRange, today: string, completed: boolean): GoalState => {
  if (completed) return 'COMPLETED';
  if (today < range.start) return 'UPCOMING';
  if (today > range.end) return 'EXPIRED';
  return 'ACTIVE';
};

export const goalMetricValue = (
  goal: ReadingGoal,
  snapshot: ReadingSnapshot,
  timeZone: string,
): number => summarizeRange(snapshot, goalRange(goal), timeZone)[VALUE_BY_TYPE[goal.type]];

export const progressFromValue = (
  goal: ReadingGoal,
  currentValue: number,
  now: Date,
  timeZone: string,
): GoalProgress => {
  const range = goalRange(goal);
  const percentage = Math.min(100, Math.round((currentValue / goal.targetValue) * 100));
  const state = resolveState(range, toDayKey(now, timeZone), currentValue >= goal.targetValue);
  return { currentValue, percentage, state };
};

export const calculateGoalProgress = (
  goal: ReadingGoal,
  snapshot: ReadingSnapshot,
  now: Date,
  timeZone: string,
): GoalProgress =>
  progressFromValue(goal, goalMetricValue(goal, snapshot, timeZone), now, timeZone);
