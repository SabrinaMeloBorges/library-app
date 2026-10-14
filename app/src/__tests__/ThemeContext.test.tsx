import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { useThemeMode } from '../hooks/useThemeMode';
import { STORAGE_KEYS } from '../services/preferencesStorage';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

beforeEach(() => AsyncStorage.clear());

describe('ThemeContext', () => {
  it('alterna o tema e persiste a preferência', async () => {
    const { result } = await renderHook(() => useThemeMode(), { wrapper });
    await waitFor(() => expect(result.current.isThemeReady).toBe(true));
    const initial = result.current.themeMode;

    await act(async () => result.current.toggleTheme());

    const expected = initial === 'dark' ? 'light' : 'dark';
    expect(result.current.themeMode).toBe(expected);
    expect(result.current.theme.appColors.background).toBeDefined();
    await waitFor(async () =>
      expect(await AsyncStorage.getItem(STORAGE_KEYS.themeMode)).toBe(JSON.stringify(expected)),
    );
  });

  it('recupera a preferência salva na inicialização', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, JSON.stringify('dark'));
    const { result } = await renderHook(() => useThemeMode(), { wrapper });
    await waitFor(() => expect(result.current.isThemeReady).toBe(true));
    expect(result.current.themeMode).toBe('dark');
  });

  it('não quebra com preferência inválida', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.themeMode, 'não é json');
    const { result } = await renderHook(() => useThemeMode(), { wrapper });
    await waitFor(() => expect(result.current.isThemeReady).toBe(true));
    expect(['light', 'dark']).toContain(result.current.themeMode);
  });
});
