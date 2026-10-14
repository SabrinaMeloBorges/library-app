import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  themeMode: 'library.preferences.themeMode',
  libraryView: 'library.preferences.libraryView',
  reminders: 'library.preferences.reminders',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export const readPreference = async <T>(
  key: StorageKey,
  isValid: (value: unknown) => value is T,
): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const writePreference = async <T>(key: StorageKey, value: T): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};
