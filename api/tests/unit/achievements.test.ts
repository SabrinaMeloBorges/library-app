import { describe, expect, it } from 'vitest';
import { reachedAchievements, type AchievementMetrics } from '../../src/domain/achievements';
import { longestReadingStreak } from '../../src/domain/readingMetrics';

const emptyMetrics: AchievementMetrics = {
  accountCreated: 1,
  booksAdded: 0,
  sessions: 0,
  pagesRead: 0,
  minutesRead: 0,
  booksFinished: 0,
  goalsCompleted: 0,
  reviews: 0,
  longestStreak: 0,
  friends: 0,
  clubs: 0,
};

describe('reachedAchievements', () => {
  it('desbloqueia apenas o primeiro acesso para contas novas', () => {
    expect(reachedAchievements(emptyMetrics).map((item) => item.code)).toEqual(['FIRST_LOGIN']);
  });

  it('respeita os limites de cada nível', () => {
    const codes = reachedAchievements({ ...emptyMetrics, pagesRead: 1200, booksFinished: 10 }).map(
      (item) => item.code,
    );
    expect(codes).toEqual(
      expect.arrayContaining(['PAGES_100', 'PAGES_1000', 'FIRST_BOOK_FINISHED', 'BOOKS_10']),
    );
    expect(codes).not.toContain('PAGES_5000');
  });
});

describe('longestReadingStreak', () => {
  const at = (iso: string) => ({ readAt: new Date(iso) });

  it('conta dias consecutivos no fuso configurado', () => {
    const streak = longestReadingStreak(
      [
        at('2026-03-01T12:00:00-03:00'),
        at('2026-03-02T23:30:00-03:00'),
        at('2026-03-03T08:00:00-03:00'),
        at('2026-03-03T20:00:00-03:00'),
        at('2026-03-05T10:00:00-03:00'),
      ],
      'America/Sao_Paulo',
    );
    expect(streak).toBe(3);
  });

  it('retorna zero sem sessões', () => {
    expect(longestReadingStreak([], 'America/Sao_Paulo')).toBe(0);
  });
});
