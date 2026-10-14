import { useCallback, useState } from 'react';
import { getErrorMessage } from '../services/apiError';
import { libraryService } from '../services/libraryService';
import { readingSessionService } from '../services/readingSessionService';
import type { LibraryItem, LibraryItemUpdate, ReadingSession } from '../types/api';
import { useAsyncResource } from './useAsyncResource';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidBookId = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

interface BookDetails {
  item: LibraryItem;
  sessions: ReadingSession[];
}

export const useLibraryItem = (bookId: string) => {
  const isValidId = isValidBookId(bookId);
  const loader = useCallback(async (): Promise<BookDetails> => {
    const [item, sessions] = await Promise.all([
      libraryService.get(bookId),
      readingSessionService.list({ userBookId: bookId }),
    ]);
    return { item, sessions };
  }, [bookId]);

  const resource = useAsyncResource(loader, { enabled: isValidId });
  const { refetch } = resource;
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const mutate = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      setIsMutating(true);
      setMutationError(null);
      try {
        await action();
        await refetch();
        return true;
      } catch (error) {
        setMutationError(getErrorMessage(error));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [refetch],
  );

  const update = useCallback(
    (changes: LibraryItemUpdate) => mutate(() => libraryService.update(bookId, changes)),
    [mutate, bookId],
  );

  const removeSession = useCallback(
    (sessionId: string) => mutate(() => readingSessionService.remove(sessionId)),
    [mutate],
  );

  const removeBook = useCallback(async (): Promise<boolean> => {
    setIsMutating(true);
    setMutationError(null);
    try {
      await libraryService.remove(bookId);
      return true;
    } catch (error) {
      setMutationError(getErrorMessage(error));
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [bookId]);

  return {
    ...resource,
    isValidId,
    isMutating,
    mutationError,
    clearMutationError: () => setMutationError(null),
    update,
    removeSession,
    removeBook,
  };
};
