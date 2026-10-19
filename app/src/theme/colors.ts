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
  accentSoft: string;
  highlightSoft: string;
  hero: string;
  onHero: string;
  bronze: string;
  silver: string;
  gold: string;
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
  accentSoft: '#DCE6D8',
  highlightSoft: '#EFE3D0',
  hero: palette.forest,
  onHero: palette.beige,
  bronze: '#A06A3B',
  silver: '#7E8C91',
  gold: '#B68A22',
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
  accentSoft: '#223129',
  highlightSoft: '#2E2720',
  hero: '#1A2A22',
  onHero: palette.parchment,
  bronze: '#C9925F',
  silver: '#A9B6BA',
  gold: '#D9B24C',
};

export const AVATAR_COLORS = [
  palette.forest,
  palette.forestSecondary,
  palette.brown,
  palette.forestAccent,
  '#7A5C45',
  '#3E5A6B',
];

export const SPINE_COLORS = [
  palette.forest,
  palette.brown,
  palette.forestAccent,
  '#B08D57',
  palette.forestSecondary,
  '#8C5A44',
];
