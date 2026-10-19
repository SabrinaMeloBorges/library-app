export interface GenreShortcut {
  subject: string;
  label: string;
  icon: string;
}

export const GENRES: GenreShortcut[] = [
  { subject: 'romance', label: 'Romance', icon: 'heart-outline' },
  { subject: 'fantasy', label: 'Fantasia', icon: 'castle' },
  { subject: 'mystery', label: 'Mistério', icon: 'magnify' },
  { subject: 'horror', label: 'Terror', icon: 'ghost-outline' },
  { subject: 'science_fiction', label: 'Ficção científica', icon: 'rocket-launch-outline' },
  { subject: 'classic_literature', label: 'Clássicos', icon: 'book-open-variant' },
  { subject: 'history', label: 'História', icon: 'bank-outline' },
  { subject: 'biography', label: 'Biografia', icon: 'account-tie-outline' },
  { subject: 'poetry', label: 'Poesia', icon: 'feather' },
  { subject: 'philosophy', label: 'Filosofia', icon: 'head-lightbulb-outline' },
];
