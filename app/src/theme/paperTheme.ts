import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import { darkColors, lightColors, type AppColors } from './colors';
import { fontFamilies } from './spacing';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme extends MD3Theme {
  appColors: AppColors;
}

const textVariant = (
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  letterSpacing = 0,
) => ({
  fontFamily,
  fontWeight: '400' as const,
  letterSpacing,
  fontSize,
  lineHeight,
});

const baseFonts = configureFonts({ config: { fontFamily: fontFamilies.body } });

const fonts: MD3Theme['fonts'] = {
  ...baseFonts,
  displayLarge: textVariant(fontFamilies.displayBold, 48, 56),
  displayMedium: textVariant(fontFamilies.displayBold, 40, 48),
  displaySmall: textVariant(fontFamilies.displayBold, 34, 40),
  headlineLarge: textVariant(fontFamilies.displayBold, 32, 38),
  headlineMedium: textVariant(fontFamilies.displayBold, 28, 34),
  headlineSmall: textVariant(fontFamilies.displayBold, 24, 30),
  titleLarge: textVariant(fontFamilies.displaySemiBold, 22, 28),
  titleMedium: textVariant(fontFamilies.bodySemiBold, 16, 22, 0.1),
  titleSmall: textVariant(fontFamilies.bodySemiBold, 14, 20, 0.1),
  labelLarge: textVariant(fontFamilies.bodyMedium, 14, 20, 0.2),
  labelMedium: textVariant(fontFamilies.bodyMedium, 12, 16, 0.3),
  labelSmall: textVariant(fontFamilies.bodyMedium, 11, 16, 0.3),
};

const buildTheme = (base: MD3Theme, appColors: AppColors): AppTheme => ({
  ...base,
  fonts,
  roundness: 3,
  appColors,
  colors: {
    ...base.colors,
    primary: appColors.primary,
    onPrimary: appColors.onPrimary,
    primaryContainer: appColors.surfaceMuted,
    onPrimaryContainer: appColors.text,
    secondary: appColors.secondary,
    secondaryContainer: appColors.surfaceMuted,
    onSecondaryContainer: appColors.text,
    tertiary: appColors.highlight,
    background: appColors.background,
    surface: appColors.surface,
    surfaceVariant: appColors.surfaceMuted,
    onSurface: appColors.text,
    onSurfaceVariant: appColors.textMuted,
    onBackground: appColors.text,
    outline: appColors.border,
    outlineVariant: appColors.border,
    error: appColors.danger,
    errorContainer: appColors.dangerSoft,
    elevation: {
      ...base.colors.elevation,
      level0: 'transparent',
      level1: appColors.surface,
      level2: appColors.surface,
      level3: appColors.surfaceMuted,
    },
  },
});

export const lightTheme = buildTheme(MD3LightTheme, lightColors);
export const darkTheme = buildTheme(MD3DarkTheme, darkColors);

export const toNavigationTheme = (theme: AppTheme, mode: ThemeMode): NavigationTheme => {
  const base = mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.appColors.primary,
      background: theme.appColors.background,
      card: theme.appColors.surface,
      text: theme.appColors.text,
      border: theme.appColors.border,
      notification: theme.appColors.highlight,
    },
  };
};
