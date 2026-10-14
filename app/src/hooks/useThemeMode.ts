import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../context/ThemeContext';

export const useThemeMode = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode deve ser usado dentro de ThemeProvider');
  return context;
};
