import type { ReadingStatus, UserBook } from './entities';

export type ProgressState = Pick<
  UserBook,
  'status' | 'currentPage' | 'totalPages' | 'startedAt' | 'finishedAt'
>;

export interface ProgressChanges {
  status?: ReadingStatus;
  currentPage?: number;
  totalPages?: number;
}

const inferStatus = (
  previous: ProgressState,
  merged: ProgressState,
  changes: ProgressChanges,
): ReadingStatus => {
  const progressChanged = changes.currentPage !== undefined;
  if (changes.status === 'WANT_TO_READ' && progressChanged && merged.currentPage > 0) {
    return 'READING';
  }
  if (changes.status) return changes.status;
  const reachedEnd = merged.totalPages > 0 && merged.currentPage >= merged.totalPages;
  if (reachedEnd) return 'FINISHED';
  if (progressChanged && previous.status === 'FINISHED') return 'READING';
  if (merged.currentPage > 0 && merged.status === 'WANT_TO_READ') return 'READING';
  return merged.status;
};

const resolveCurrentPage = (status: ReadingStatus, merged: ProgressState): number => {
  if (status === 'FINISHED') return merged.totalPages;
  if (status === 'WANT_TO_READ') return 0;
  return merged.currentPage;
};

export const resolveProgress = (
  previous: ProgressState,
  changes: ProgressChanges,
  now: Date,
): ProgressState => {
  const merged: ProgressState = {
    ...previous,
    ...(changes.currentPage !== undefined ? { currentPage: changes.currentPage } : {}),
    ...(changes.totalPages !== undefined ? { totalPages: changes.totalPages } : {}),
  };
  const status = inferStatus(previous, merged, changes);
  const isFinished = status === 'FINISHED';
  const isQueued = status === 'WANT_TO_READ';

  return {
    status,
    totalPages: merged.totalPages,
    currentPage: resolveCurrentPage(status, merged),
    startedAt: isQueued ? null : (previous.startedAt ?? now),
    finishedAt: isFinished
      ? previous.status === 'FINISHED'
        ? (previous.finishedAt ?? now)
        : now
      : null,
  };
};

export const progressPercentage = (currentPage: number, totalPages: number): number =>
  totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;
