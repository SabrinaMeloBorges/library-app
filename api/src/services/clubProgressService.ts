import type { ReadingGoal, UserSummary } from '../domain/entities';
import { goalMetricValue, progressFromValue, type GoalProgress } from '../domain/goalProgress';
import type { ClubRepository } from '../repositories/contracts';
import type { ReadingSnapshotService } from './readingSnapshotService';

export interface MemberContribution {
  user: UserSummary;
  value: number;
}

export interface CollectiveProgress {
  progress: GoalProgress;
  contributions: MemberContribution[];
}

export class ClubProgressService {
  constructor(
    private readonly clubs: ClubRepository,
    private readonly snapshots: ReadingSnapshotService,
    private readonly timeZone: string,
  ) {}

  async calculate(goal: ReadingGoal): Promise<CollectiveProgress> {
    if (!goal.clubId) throw new Error('A meta não pertence a um clube');
    const members = await this.clubs.listMembers(goal.clubId);
    const contributions = await Promise.all(
      members.map(async (member) => ({
        user: member.user,
        value: goalMetricValue(goal, await this.snapshots.load(member.userId), this.timeZone),
      })),
    );
    contributions.sort((a, b) => b.value - a.value);
    const total = contributions.reduce((sum, contribution) => sum + contribution.value, 0);
    return { progress: progressFromValue(goal, total, new Date(), this.timeZone), contributions };
  }
}
