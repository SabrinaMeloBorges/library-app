import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS, readPreference, writePreference } from '../services/preferencesStorage';
import { darkTheme, lightTheme, type AppTheme, type ThemeMode } from '../theme/paperTheme';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  theme: AppTheme;
  isThemeReady: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let active = true;
    readPreference(STORAGE_KEYS.themeMode, isThemeMode).then((stored) => {
      if (!active) return;
      if (stored) setThemeModeState(stored);
      setIsThemeReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void writePreference(STORAGE_KEYS.themeMode, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      void writePreference(STORAGE_KEYS.themeMode, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      theme: themeMode === 'dark' ? darkTheme : lightTheme,
      isThemeReady,
      toggleTheme,
      setThemeMode,
    }),
    [themeMode, isThemeReady, toggleTheme, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
