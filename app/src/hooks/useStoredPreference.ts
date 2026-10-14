import { useCallback, useEffect, useState } from 'react';
import { readPreference, writePreference, type StorageKey } from '../services/preferencesStorage';

export const useStoredPreference = <T>(
  key: StorageKey,
  defaultValue: T,
  isValid: (value: unknown) => value is T,
): [T, (value: T) => void, boolean] => {
  const [value, setValue] = useState<T>(defaultValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    readPreference(key, isValid).then((stored) => {
      if (!active) return;
      if (stored !== null) setValue(stored);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, [key, isValid]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      void writePreference(key, next);
    },
    [key],
  );

  return [value, update, isReady];
};
