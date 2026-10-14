export const palette = {
  forest: '#263C32',
  forestSecondary: '#456653',
  forestAccent: '#63836B',
  beige: '#F7F2E8',
  beigeSecondary: '#E9DFC8',
  brown: '#6B4F3A',
  ink: '#292820',
  white: '#FFFFFF',
  danger: '#9E3B2F',
  dangerSoft: '#F3DED8',
  night: '#141B17',
  nightSurface: '#1D2621',
  nightSurfaceHigh: '#26322B',
  mist: '#A9C4B0',
  parchment: '#EDE6D6',
  sand: '#C8B48E',
} as const;

export interface AppColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  dangerSoft: string;
  highlight: string;
}

export const lightColors: AppColors = {
  background: palette.beige,
  surface: palette.white,
  surfaceMuted: palette.beigeSecondary,
  primary: palette.forest,
  onPrimary: palette.beige,
  secondary: palette.forestSecondary,
  accent: palette.forestAccent,
  text: palette.ink,
  textMuted: '#5E5A4E',
  border: '#D9CDB3',
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  highlight: palette.brown,
};

export const darkColors: AppColors = {
  background: palette.night,
  surface: palette.nightSurface,
  surfaceMuted: palette.nightSurfaceHigh,
  primary: palette.mist,
  onPrimary: palette.night,
  secondary: '#7FA08A',
  accent: palette.forestAccent,
  text: palette.parchment,
  textMuted: '#B3AC9C',
  border: '#34423A',
  danger: '#E39A8E',
  dangerSoft: '#3A2522',
  highlight: palette.sand,
};
