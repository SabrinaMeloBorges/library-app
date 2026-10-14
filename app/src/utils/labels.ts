import type {
  GoalPeriod,
  GoalState,
  GoalType,
  LibrarySortField,
  ReadingStatus,
} from '../types/api';

export const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: string }[] = [
  { value: 'WANT_TO_READ', label: 'Quero ler', icon: 'bookmark-outline' },
  { value: 'READING', label: 'Lendo', icon: 'book-open-page-variant-outline' },
  { value: 'FINISHED', label: 'Concluído', icon: 'check-circle-outline' },
  { value: 'PAUSED', label: 'Pausado', icon: 'pause-circle-outline' },
  { value: 'ABANDONED', label: 'Abandonado', icon: 'close-circle-outline' },
];

export const STATUS_LABELS: Record<ReadingStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ReadingStatus, string>;

export const STATUS_ICONS: Record<ReadingStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.icon]),
) as Record<ReadingStatus, string>;

export const GOAL_TYPE_OPTIONS: { value: GoalType; label: string; unit: string }[] = [
  { value: 'BOOKS_FINISHED', label: 'Livros concluídos', unit: 'livros' },
  { value: 'PAGES_READ', label: 'Páginas lidas', unit: 'páginas' },
  { value: 'MINUTES_READ', label: 'Minutos de leitura', unit: 'minutos' },
  { value: 'READING_DAYS', label: 'Dias de leitura', unit: 'dias' },
];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = Object.fromEntries(
  GOAL_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<GoalType, string>;

export const GOAL_UNITS: Record<GoalType, string> = Object.fromEntries(
  GOAL_TYPE_OPTIONS.map((option) => [option.value, option.unit]),
) as Record<GoalType, string>;

export const GOAL_PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
  { value: 'CUSTOM', label: 'Personalizada' },
];

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = Object.fromEntries(
  GOAL_PERIOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<GoalPeriod, string>;

export const GOAL_STATE_LABELS: Record<GoalState, string> = {
  UPCOMING: 'Agendada',
  ACTIVE: 'Em andamento',
  COMPLETED: 'Concluída',
  EXPIRED: 'Encerrada',
};

export const SORT_OPTIONS: { value: LibrarySortField; label: string }[] = [
  { value: 'updatedAt', label: 'Atualizados recentemente' },
  { value: 'title', label: 'Título (A–Z)' },
  { value: 'progress', label: 'Progresso' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'createdAt', label: 'Adicionados recentemente' },
];

export const WEEKDAY_OPTIONS: { value: number; short: string; label: string }[] = [
  { value: 1, short: 'D', label: 'Domingo' },
  { value: 2, short: 'S', label: 'Segunda' },
  { value: 3, short: 'T', label: 'Terça' },
  { value: 4, short: 'Q', label: 'Quarta' },
  { value: 5, short: 'Q', label: 'Quinta' },
  { value: 6, short: 'S', label: 'Sexta' },
  { value: 7, short: 'S', label: 'Sábado' },
];
