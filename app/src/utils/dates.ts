import type { GoalPeriod } from '../types/api';

const pad = (value: number): string => String(value).padStart(2, '0');

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toTimeKey = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatTime = (hour: number, minute: number): string => `${pad(hour)}:${pad(minute)}`;

export const isValidDateKey = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const isValidTimeKey = (value: string): boolean => {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

export const combineDateAndTime = (dateKey: string, timeKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = timeKey.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

export const periodRange = (
  period: GoalPeriod,
  reference: Date = new Date(),
): { start: string; end: string } => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  switch (period) {
    case 'DAILY':
      return { start: toDateKey(reference), end: toDateKey(reference) };
    case 'WEEKLY': {
      const start = new Date(year, month, reference.getDate() - reference.getDay());
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return { start: toDateKey(start), end: toDateKey(end) };
    }
    case 'MONTHLY':
      return {
        start: toDateKey(new Date(year, month, 1)),
        end: toDateKey(new Date(year, month + 1, 0)),
      };
    case 'YEARLY':
    case 'CUSTOM':
      return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | Date): string => dateFormatter.format(new Date(value));

export const formatDateKey = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
};

export const formatDateTime = (value: string | Date): string =>
  dateTimeFormatter.format(new Date(value));

export const formatMinutes = (totalMinutes: number): string => {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const formatRelative = (value: string | Date, now: Date = new Date()): string => {
  const elapsed = now.getTime() - new Date(value).getTime();
  if (elapsed < MINUTE_MS) return 'agora';
  if (elapsed < HOUR_MS) return `há ${Math.floor(elapsed / MINUTE_MS)} min`;
  if (elapsed < DAY_MS) return `há ${Math.floor(elapsed / HOUR_MS)} h`;
  if (elapsed < 7 * DAY_MS) {
    const days = Math.floor(elapsed / DAY_MS);
    return days === 1 ? 'ontem' : `há ${days} dias`;
  }
  return formatDate(value);
};

export const greetingFor = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};
