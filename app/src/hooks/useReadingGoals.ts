import { useCallback, useState } from 'react';
import { getErrorMessage } from '../services/apiError';
import { goalService } from '../services/goalService';
import type { ReadingGoal } from '../types/api';
import { useAsyncResource } from './useAsyncResource';

export const useReadingGoals = () => {
  const loader = useCallback(() => goalService.list(), []);
  const resource = useAsyncResource<ReadingGoal[]>(loader);
  const { refetch } = resource;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const removeGoal = useCallback(
    async (goalId: string): Promise<boolean> => {
      setDeletingId(goalId);
      setActionError(null);
      try {
        await goalService.remove(goalId);
        await refetch();
        return true;
      } catch (error) {
        setActionError(getErrorMessage(error));
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [refetch],
  );

  return {
    goals: resource.data ?? [],
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    reload: resource.reload,
    refresh: resource.refresh,
    removeGoal,
    deletingId,
    actionError,
    clearActionError: () => setActionError(null),
  };
};
