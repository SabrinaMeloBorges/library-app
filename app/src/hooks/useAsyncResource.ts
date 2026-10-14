import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/apiError';

export interface AsyncResource<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface Options {
  refetchOnFocus?: boolean;
  enabled?: boolean;
}

interface ResourceState<T> {
  source: unknown;
  data: T | null;
  error: string | null;
}

export const useAsyncResource = <T>(
  loader: () => Promise<T>,
  { refetchOnFocus = true, enabled = true }: Options = {},
): AsyncResource<T> => {
  const [state, setState] = useState<ResourceState<T>>({ source: null, data: null, error: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const loadedSourceRef = useRef<unknown>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => isMountedRef.current && requestId === requestIdRef.current;
    try {
      const result = await loader();
      if (!isCurrent()) return;
      loadedSourceRef.current = loader;
      setState({ source: loader, data: result, error: null });
    } catch (caught) {
      if (!isCurrent()) return;
      loadedSourceRef.current = loader;
      setState((current) => ({
        source: loader,
        data: current.data,
        error: getErrorMessage(caught),
      }));
    }
  }, [loader]);

  useEffect(() => {
    if (enabled) void fetchData();
  }, [fetchData, enabled]);

  useFocusEffect(
    useCallback(() => {
      if (enabled && refetchOnFocus && loadedSourceRef.current === loader) void fetchData();
    }, [enabled, refetchOnFocus, fetchData, loader]),
  );

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, source: null, error: null }));
    await fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    if (isMountedRef.current) setIsRefreshing(false);
  }, [fetchData]);

  return {
    data: state.data,
    error: state.error,
    isLoading: enabled && state.source !== loader,
    isRefreshing,
    reload,
    refresh,
    refetch: fetchData,
  };
};
