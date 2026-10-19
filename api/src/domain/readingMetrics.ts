import type { ReadingSession, UserBook } from './entities';
import { isWithinRange, toDayKey, type DayRange } from './calendar';

type PageInterval = [start: number, end: number];

const mergeIntervals = (intervals: PageInterval[]): PageInterval[] => {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  return sorted.reduce<PageInterval[]>((merged, current) => {
    const last = merged[merged.length - 1];
    if (last && current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push([current[0], current[1]]);
    }
    return merged;
  }, []);
};

export const pagesInSession = (session: Pick<ReadingSession, 'startPage' | 'endPage'>): number =>
  Math.max(session.endPage - session.startPage, 0);

export const countUniquePagesRead = (
  sessions: Pick<ReadingSession, 'userBookId' | 'startPage' | 'endPage'>[],
): number => {
  const intervalsByBook = new Map<string, PageInterval[]>();
  for (const session of sessions) {
    const intervals = intervalsByBook.get(session.userBookId) ?? [];
    intervals.push([session.startPage, session.endPage]);
    intervalsByBook.set(session.userBookId, intervals);
  }
  let total = 0;
  for (const intervals of intervalsByBook.values()) {
    total += mergeIntervals(intervals).reduce((sum, [start, end]) => sum + (end - start), 0);
  }
  return total;
};

export const sumMinutesRead = (sessions: Pick<ReadingSession, 'durationMinutes'>[]): number =>
  sessions.reduce((sum, session) => sum + session.durationMinutes, 0);

export const countReadingDays = (
  sessions: Pick<ReadingSession, 'readAt'>[],
  timeZone: string,
): number => new Set(sessions.map((session) => toDayKey(session.readAt, timeZone))).size;

const DAY_MS = 24 * 60 * 60 * 1000;

const dayNumber = (dayKey: string): number =>
  Math.round(Date.parse(`${dayKey}T00:00:00Z`) / DAY_MS);

export const longestReadingStreak = (
  sessions: Pick<ReadingSession, 'readAt'>[],
  timeZone: string,
): number => {
  const days = [
    ...new Set(sessions.map((session) => dayNumber(toDayKey(session.readAt, timeZone)))),
  ];
  days.sort((a, b) => a - b);
  let longest = 0;
  let current = 0;
  days.forEach((day, index) => {
    current = index > 0 && day - days[index - 1] === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  });
  return longest;
};

export const filterSessionsInRange = <T extends Pick<ReadingSession, 'readAt'>>(
  sessions: T[],
  range: DayRange,
  timeZone: string,
): T[] => sessions.filter((session) => isWithinRange(toDayKey(session.readAt, timeZone), range));

export const countFinishedBooksInRange = (
  userBooks: Pick<UserBook, 'status' | 'finishedAt'>[],
  range: DayRange,
  timeZone: string,
): number =>
  userBooks.filter(
    (userBook) =>
      userBook.status === 'FINISHED' &&
      userBook.finishedAt !== null &&
      isWithinRange(toDayKey(userBook.finishedAt, timeZone), range),
  ).length;

export interface ReadingSnapshot {
  sessions: ReadingSession[];
  userBooks: UserBook[];
}

export interface ReadingSummary {
  booksFinished: number;
  pagesRead: number;
  minutesRead: number;
  readingDays: number;
}

export const summarizeRange = (
  snapshot: ReadingSnapshot,
  range: DayRange,
  timeZone: string,
): ReadingSummary => {
  const sessions = filterSessionsInRange(snapshot.sessions, range, timeZone);
  return {
    booksFinished: countFinishedBooksInRange(snapshot.userBooks, range, timeZone),
    pagesRead: countUniquePagesRead(sessions),
    minutesRead: sumMinutesRead(sessions),
    readingDays: countReadingDays(sessions, timeZone),
  };
};
