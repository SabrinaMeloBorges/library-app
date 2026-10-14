import {
  ACHIEVEMENTS,
  findAchievement,
  reachedAchievements,
  type AchievementDefinition,
  type AchievementMetrics,
} from '../domain/achievements';
import type { ReadingGoal } from '../domain/entities';
import { calculateGoalProgress } from '../domain/goalProgress';
import {
  countUniquePagesRead,
  longestReadingStreak,
  sumMinutesRead,
} from '../domain/readingMetrics';
import { AppError } from '../errors/AppError';
import type {
  AchievementRepository,
  ClubRepository,
  FollowRepository,
  ReadingGoalRepository,
  UserRepository,
} from '../repositories/contracts';
import type { ActivityService } from './activityService';
import type { ClubProgressService } from './clubProgressService';
import type { DetailedSnapshot, ReadingSnapshotService } from './readingSnapshotService';

export interface AchievementStatus {
  definition: AchievementDefinition;
  unlockedAt: Date | null;
  currentValue: number;
}

export interface UnlockedAchievement {
  definition: AchievementDefinition;
  unlockedAt: Date;
}

const isCompletable = (goal: ReadingGoal): boolean => goal.completedAt === null;

export class AchievementService {
  constructor(
    private readonly achievements: AchievementRepository,
    private readonly users: UserRepository,
    private readonly goals: ReadingGoalRepository,
    private readonly follows: FollowRepository,
    private readonly clubs: ClubRepository,
    private readonly snapshots: ReadingSnapshotService,
    private readonly clubProgress: ClubProgressService,
    private readonly activities: ActivityService,
    private readonly timeZone: string,
  ) {}

  async evaluate(userId: string): Promise<string[]> {
    const snapshot = await this.snapshots.load(userId);
    const clubIds = (await this.clubs.listForUser(userId)).map((club) => club.id);
    await this.completePersonalGoals(userId, snapshot);
    await this.completeClubGoals(userId, clubIds);

    const metrics = await this.collectMetrics(userId, snapshot, clubIds);
    const unlocked: string[] = [];
    for (const achievement of reachedAchievements(metrics)) {
      if (await this.achievements.unlock(userId, achievement.code, new Date())) {
        unlocked.push(achievement.code);
        await this.activities.recordAchievement(userId, achievement.code);
      }
    }
    return unlocked;
  }

  async list(userId: string): Promise<AchievementStatus[]> {
    const [unlocked, snapshot, clubs] = await Promise.all([
      this.achievements.listForUser(userId),
      this.snapshots.load(userId),
      this.clubs.listForUser(userId),
    ]);
    const metrics = await this.collectMetrics(
      userId,
      snapshot,
      clubs.map((club) => club.id),
    );
    const unlockedAt = new Map(unlocked.map((item) => [item.code, item.unlockedAt]));
    return ACHIEVEMENTS.map((definition) => ({
      definition,
      unlockedAt: unlockedAt.get(definition.code) ?? null,
      currentValue: Math.min(metrics[definition.metric], definition.threshold),
    }));
  }

  async listUnlocked(userId: string): Promise<UnlockedAchievement[]> {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.notFound('Usuário não encontrado');
    return this.toUnlocked(await this.achievements.listForUser(userId));
  }

  async pending(userId: string): Promise<UnlockedAchievement[]> {
    return this.toUnlocked(await this.achievements.listUnseen(userId));
  }

  async markSeen(userId: string, codes: string[]): Promise<void> {
    await this.achievements.markSeen(userId, codes, new Date());
  }

  private toUnlocked(items: { code: string; unlockedAt: Date }[]): UnlockedAchievement[] {
    return items.flatMap((item) => {
      const definition = findAchievement(item.code);
      return definition ? [{ definition, unlockedAt: item.unlockedAt }] : [];
    });
  }

  private async completePersonalGoals(userId: string, snapshot: DetailedSnapshot): Promise<void> {
    const goals = (await this.goals.list(userId)).filter(isCompletable);
    for (const goal of goals) {
      const progress = calculateGoalProgress(goal, snapshot, new Date(), this.timeZone);
      if (progress.currentValue >= goal.targetValue) await this.complete(userId, goal);
    }
  }

  private async completeClubGoals(userId: string, clubIds: string[]): Promise<void> {
    const goals = (await this.goals.listByClubIds(clubIds)).filter(isCompletable);
    for (const goal of goals) {
      const { progress } = await this.clubProgress.calculate(goal);
      if (progress.currentValue >= goal.targetValue) await this.complete(userId, goal);
    }
  }

  private async complete(userId: string, goal: ReadingGoal): Promise<void> {
    await this.goals.markCompleted(goal.id, new Date());
    await this.activities.recordGoalCompleted(userId, goal.id);
  }

  private async collectMetrics(
    userId: string,
    snapshot: DetailedSnapshot,
    clubIds: string[],
  ): Promise<AchievementMetrics> {
    const [personalGoals, clubGoals, followingIds, followerIds] = await Promise.all([
      this.goals.list(userId),
      this.goals.listByClubIds(clubIds),
      this.follows.followingIds(userId),
      this.follows.followerIds(userId),
    ]);
    const followers = new Set(followerIds);
    const { sessions, userBooks } = snapshot;

    return {
      accountCreated: 1,
      booksAdded: userBooks.length,
      sessions: sessions.length,
      pagesRead: countUniquePagesRead(sessions),
      minutesRead: sumMinutesRead(sessions),
      booksFinished: userBooks.filter((item) => item.status === 'FINISHED').length,
      goalsCompleted: [...personalGoals, ...clubGoals].filter((goal) => goal.completedAt).length,
      reviews: userBooks.filter((item) => Boolean(item.review)).length,
      longestStreak: longestReadingStreak(sessions, this.timeZone),
      friends: followingIds.filter((id) => followers.has(id)).length,
      clubs: clubIds.length,
    };
  }
}
