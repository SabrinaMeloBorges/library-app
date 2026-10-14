import { describe, expect, it } from 'vitest';
import type { ReadingGoal, ReadingSession } from '../../src/domain/entities';
import { calculateGoalProgress } from '../../src/domain/goalProgress';

const timeZone = 'America/Sao_Paulo';

const goal = (overrides: Partial<ReadingGoal>): ReadingGoal => ({
  id: 'goal',
  userId: 'user',
  clubId: null,
  completedAt: null,
  title: 'Meta',
  type: 'PAGES_READ',
  period: 'MONTHLY',
  targetValue: 100,
  startDate: new Date('2026-05-01T00:00:00Z'),
  endDate: new Date('2026-05-31T00:00:00Z'),
  createdAt: new Date(),
  ...overrides,
});

const session = (overrides: Partial<ReadingSession>): ReadingSession => ({
  id: Math.random().toString(),
  userId: 'user',
  userBookId: 'book',
  startPage: 0,
  endPage: 10,
  durationMinutes: 20,
  readAt: new Date('2026-05-10T15:00:00Z'),
  note: null,
  createdAt: new Date(),
  ...overrides,
});

describe('calculateGoalProgress', () => {
  const now = new Date('2026-05-15T12:00:00Z');

  it('calcula páginas únicas apenas dentro do período', () => {
    const progress = calculateGoalProgress(
      goal({}),
      {
        sessions: [
          session({ startPage: 0, endPage: 40 }),
          session({ startPage: 30, endPage: 60 }),
          session({ startPage: 60, endPage: 90, readAt: new Date('2026-04-20T12:00:00Z') }),
        ],
        userBooks: [],
      },
      now,
      timeZone,
    );
    expect(progress.currentValue).toBe(60);
    expect(progress.percentage).toBe(60);
    expect(progress.state).toBe('ACTIVE');
  });

  it('marca a meta como concluída ao atingir o valor desejado', () => {
    const progress = calculateGoalProgress(
      goal({ type: 'MINUTES_READ', targetValue: 30 }),
      { sessions: [session({ durationMinutes: 45 })], userBooks: [] },
      now,
      timeZone,
    );
    expect(progress.state).toBe('COMPLETED');
    expect(progress.percentage).toBe(100);
  });

  it('marca a meta como expirada após o término', () => {
    const progress = calculateGoalProgress(
      goal({ type: 'READING_DAYS', targetValue: 10 }),
      { sessions: [session({})], userBooks: [] },
      new Date('2026-06-02T12:00:00Z'),
      timeZone,
    );
    expect(progress.state).toBe('EXPIRED');
    expect(progress.currentValue).toBe(1);
  });
});
