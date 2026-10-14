export interface DayRange {
  start: string;
  end: string;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
};

export const toDayKey = (date: Date, timeZone: string): string =>
  getFormatter(timeZone).format(date);

export const toDateOnlyKey = (date: Date): string => date.toISOString().slice(0, 10);

export const parseDateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export const isWithinRange = (dayKey: string, range: DayRange): boolean =>
  dayKey >= range.start && dayKey <= range.end;

export const yearRangeOf = (date: Date, timeZone: string): DayRange => {
  const year = toDayKey(date, timeZone).slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
};
