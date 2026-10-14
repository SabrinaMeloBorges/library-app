import { useCallback, useMemo, useState } from 'react';
import { getErrorMessage } from '../services/apiError';
import { feedService } from '../services/feedService';
import type { FeedActivity } from '../types/social';
import { useAsyncResource } from './useAsyncResource';

const PAGE_SIZE = 20;

type LikeOverride = Pick<FeedActivity, 'likedByMe' | 'likeCount'>;

export const useActivityList = (loadPage: (before?: string) => Promise<FeedActivity[]>) => {
  const firstPage = useCallback(() => loadPage(), [loadPage]);
  const resource = useAsyncResource(firstPage);
  const [extraPages, setExtraPages] = useState<FeedActivity[]>([]);
  const [overrides, setOverrides] = useState<Record<string, LikeOverride>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const items = useMemo(
    () =>
      [...(resource.data ?? []), ...extraPages].map((activity) => ({
        ...activity,
        ...overrides[activity.id],
      })),
    [resource.data, extraPages, overrides],
  );

  const refresh = useCallback(async () => {
    setExtraPages([]);
    setOverrides({});
    setHasMore(true);
    await resource.refresh();
  }, [resource]);

  const loadMore = useCallback(async () => {
    const last = items[items.length - 1];
    const firstPageFull = (resource.data?.length ?? 0) >= PAGE_SIZE;
    if (!last || isLoadingMore || !hasMore || !firstPageFull) return;
    setIsLoadingMore(true);
    try {
      const page = await loadPage(last.createdAt);
      setExtraPages((current) => [...current, ...page]);
      setHasMore(page.length >= PAGE_SIZE);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  }, [items, isLoadingMore, hasMore, loadPage, resource.data]);

  const toggleLike = useCallback(async (activity: FeedActivity) => {
    const optimistic: LikeOverride = {
      likedByMe: !activity.likedByMe,
      likeCount: activity.likeCount + (activity.likedByMe ? -1 : 1),
    };
    setOverrides((current) => ({ ...current, [activity.id]: optimistic }));
    try {
      const updated = activity.likedByMe
        ? await feedService.unlike(activity.id)
        : await feedService.like(activity.id);
      setOverrides((current) => ({
        ...current,
        [activity.id]: { likedByMe: updated.likedByMe, likeCount: updated.likeCount },
      }));
    } catch (error) {
      setOverrides((current) => ({
        ...current,
        [activity.id]: { likedByMe: activity.likedByMe, likeCount: activity.likeCount },
      }));
      setActionError(getErrorMessage(error));
    }
  }, []);

  return {
    items,
    isLoading: resource.isLoading,
    isRefreshing: resource.isRefreshing,
    error: resource.error,
    reload: resource.reload,
    refresh,
    loadMore,
    isLoadingMore,
    toggleLike,
    actionError,
    clearActionError: () => setActionError(null),
  };
};
