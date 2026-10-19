import { useCallback } from 'react';
import { libraryService } from '../services/libraryService';
import type { LibraryItem, LibraryQuery } from '../types/api';
import { useAsyncResource, type AsyncResource } from './useAsyncResource';

export const useLibrary = (query: LibraryQuery): AsyncResource<LibraryItem[]> => {
  const { status, q, favorites, sort, order } = query;
  const loader = useCallback(
    () => libraryService.list({ status, q, favorites, sort, order }),
    [status, q, favorites, sort, order],
  );
  return useAsyncResource(loader);
};
