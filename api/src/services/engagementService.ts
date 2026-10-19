import type { UserBook, UserBookWithBook } from '../domain/entities';
import type { AchievementService } from './achievementService';
import type { ActivityService } from './activityService';

export type BookSnapshot = Pick<UserBook, 'status' | 'review'> | null;

export interface EngagementHooks {
  bookChanged(userId: string, before: BookSnapshot, after: UserBookWithBook): Promise<void>;
  readingChanged(userId: string): Promise<void>;
  usersChanged(userIds: string[]): Promise<void>;
}

const runSafely = async (label: string, task: () => Promise<unknown>): Promise<void> => {
  try {
    await task();
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[engagement] falha ao processar ${label}: ${name}`);
  }
};

export class EngagementService implements EngagementHooks {
  constructor(
    private readonly activities: ActivityService,
    private readonly achievements: AchievementService,
  ) {}

  async bookChanged(userId: string, before: BookSnapshot, after: UserBookWithBook): Promise<void> {
    await runSafely('atividade do livro', () =>
      this.activities.recordBookProgress(userId, before, after),
    );
    await this.readingChanged(userId);
  }

  async readingChanged(userId: string): Promise<void> {
    await runSafely('conquistas', () => this.achievements.evaluate(userId));
  }

  async usersChanged(userIds: string[]): Promise<void> {
    for (const userId of new Set(userIds)) await this.readingChanged(userId);
  }
}
