export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface AchievementMetrics {
  accountCreated: number;
  booksAdded: number;
  sessions: number;
  pagesRead: number;
  minutesRead: number;
  booksFinished: number;
  goalsCompleted: number;
  reviews: number;
  longestStreak: number;
  friends: number;
  clubs: number;
}

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  tier: AchievementTier;
  metric: keyof AchievementMetrics;
  threshold: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    code: 'FIRST_LOGIN',
    title: 'Primeira página',
    description: 'Entrou no Library pela primeira vez.',
    tier: 'BRONZE',
    metric: 'accountCreated',
    threshold: 1,
  },
  {
    code: 'FIRST_BOOK',
    title: 'Estante inaugurada',
    description: 'Adicionou o primeiro livro à biblioteca.',
    tier: 'BRONZE',
    metric: 'booksAdded',
    threshold: 1,
  },
  {
    code: 'FIRST_SESSION',
    title: 'Marcador no lugar',
    description: 'Registrou a primeira sessão de leitura.',
    tier: 'BRONZE',
    metric: 'sessions',
    threshold: 1,
  },
  {
    code: 'PAGES_100',
    title: 'Cem páginas',
    description: 'Leu 100 páginas registradas em sessões.',
    tier: 'BRONZE',
    metric: 'pagesRead',
    threshold: 100,
  },
  {
    code: 'FIRST_REVIEW',
    title: 'Crítica de estreia',
    description: 'Escreveu a primeira resenha.',
    tier: 'BRONZE',
    metric: 'reviews',
    threshold: 1,
  },
  {
    code: 'FIRST_FRIEND',
    title: 'Companhia de leitura',
    description: 'Fez a primeira amizade: vocês se seguem.',
    tier: 'BRONZE',
    metric: 'friends',
    threshold: 1,
  },
  {
    code: 'FIRST_CLUB',
    title: 'Clube do livro',
    description: 'Criou ou entrou em um clube do livro.',
    tier: 'BRONZE',
    metric: 'clubs',
    threshold: 1,
  },
  {
    code: 'FIRST_BOOK_FINISHED',
    title: 'Ponto final',
    description: 'Concluiu o primeiro livro.',
    tier: 'SILVER',
    metric: 'booksFinished',
    threshold: 1,
  },
  {
    code: 'FIRST_GOAL',
    title: 'Meta batida',
    description: 'Concluiu a primeira meta de leitura.',
    tier: 'SILVER',
    metric: 'goalsCompleted',
    threshold: 1,
  },
  {
    code: 'PAGES_1000',
    title: 'Mil páginas',
    description: 'Leu 1.000 páginas registradas em sessões.',
    tier: 'SILVER',
    metric: 'pagesRead',
    threshold: 1000,
  },
  {
    code: 'STREAK_7',
    title: 'Semana de leitura',
    description: 'Leu em 7 dias seguidos.',
    tier: 'SILVER',
    metric: 'longestStreak',
    threshold: 7,
  },
  {
    code: 'HOURS_10',
    title: 'Dez horas entre páginas',
    description: 'Somou 10 horas de leitura.',
    tier: 'SILVER',
    metric: 'minutesRead',
    threshold: 600,
  },
  {
    code: 'BOOKS_10',
    title: 'Leitor voraz',
    description: 'Concluiu 10 livros.',
    tier: 'GOLD',
    metric: 'booksFinished',
    threshold: 10,
  },
  {
    code: 'PAGES_5000',
    title: 'Cinco mil páginas',
    description: 'Leu 5.000 páginas registradas em sessões.',
    tier: 'GOLD',
    metric: 'pagesRead',
    threshold: 5000,
  },
  {
    code: 'STREAK_30',
    title: 'Hábito de ferro',
    description: 'Leu em 30 dias seguidos.',
    tier: 'GOLD',
    metric: 'longestStreak',
    threshold: 30,
  },
  {
    code: 'GOALS_5',
    title: 'Colecionador de metas',
    description: 'Concluiu 5 metas de leitura.',
    tier: 'GOLD',
    metric: 'goalsCompleted',
    threshold: 5,
  },
];

const ACHIEVEMENTS_BY_CODE = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.code, achievement]),
);

export const findAchievement = (code: string): AchievementDefinition | undefined =>
  ACHIEVEMENTS_BY_CODE.get(code);

export const reachedAchievements = (metrics: AchievementMetrics): AchievementDefinition[] =>
  ACHIEVEMENTS.filter((achievement) => metrics[achievement.metric] >= achievement.threshold);
