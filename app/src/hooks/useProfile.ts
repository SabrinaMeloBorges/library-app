import { useCallback } from 'react';
import { socialService } from '../services/socialService';
import { useActivityList } from './useActivityList';
import { useAsyncResource } from './useAsyncResource';

export const useProfile = (userId: string | undefined) => {
  const loadProfile = useCallback(() => socialService.profile(userId as string), [userId]);
  const profile = useAsyncResource(loadProfile, { enabled: Boolean(userId) });
  const loadActivities = useCallback(
    () => (userId ? socialService.activities(userId) : Promise.resolve([])),
    [userId],
  );
  const activities = useActivityList(loadActivities);

  const refresh = useCallback(async () => {
    await Promise.all([profile.refresh(), activities.refresh()]);
  }, [profile, activities]);

  return { profile, activities, refresh };
};
