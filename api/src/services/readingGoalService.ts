import { parseDateOnly, toDateOnlyKey } from '../domain/calendar';
import type { ReadingGoal } from '../domain/entities';
import { calculateGoalProgress, type GoalProgress } from '../domain/goalProgress';
import type { ReadingSnapshot } from '../domain/readingMetrics';
import { AppError } from '../errors/AppError';
import type { ReadingGoalData, ReadingGoalRepository } from '../repositories/contracts';
import type { CreateGoalInput, UpdateGoalInput } from '../validators/goalValidators';
import type { EngagementHooks } from './engagementService';
import type { DetailedSnapshot, ReadingSnapshotService } from './readingSnapshotService';

const GOAL_NOT_FOUND = 'Meta não encontrada';
const INVALID_RANGE = 'A data de término deve ser igual ou posterior à data de início';

export interface GoalWithProgress extends ReadingGoal {
  progress: GoalProgress;
}

export const toGoalData = (input: CreateGoalInput): ReadingGoalData => ({
  ...input,
  startDate: parseDateOnly(input.startDate),
  endDate: parseDateOnly(input.endDate),
});

export const buildGoalChanges = (
  current: ReadingGoal,
  input: UpdateGoalInput,
): Partial<ReadingGoalData> => {
  const startDate = input.startDate ?? toDateOnlyKey(current.startDate);
  const endDate = input.endDate ?? toDateOnlyKey(current.endDate);
  if (endDate < startDate) {
    throw AppError.validation(INVALID_RANGE, [{ field: 'endDate', message: INVALID_RANGE }]);
  }
  const { startDate: _start, endDate: _end, ...rest } = input;
  return {
    ...rest,
    ...(input.startDate ? { startDate: parseDateOnly(input.startDate) } : {}),
    ...(input.endDate ? { endDate: parseDateOnly(input.endDate) } : {}),
  };
};

export class ReadingGoalService {
  constructor(
    private readonly goals: ReadingGoalRepository,
    private readonly snapshots: ReadingSnapshotService,
    private readonly engagement: EngagementHooks,
    private readonly timeZone: string,
  ) {}

  async list(userId: string): Promise<GoalWithProgress[]> {
    const [goals, snapshot] = await Promise.all([
      this.goals.list(userId),
      this.loadSnapshot(userId),
    ]);
    return goals.map((goal) => this.withProgress(goal, snapshot));
  }

  async get(userId: string, id: string): Promise<GoalWithProgress> {
    const goal = await this.findGoal(userId, id);
    return this.withProgress(goal, await this.loadSnapshot(userId));
  }

  async create(userId: string, input: CreateGoalInput): Promise<GoalWithProgress> {
    const goal = await this.goals.create(userId, toGoalData(input));
    await this.engagement.readingChanged(userId);
    return this.get(userId, goal.id);
  }

  async update(userId: string, id: string, input: UpdateGoalInput): Promise<GoalWithProgress> {
    const current = await this.findGoal(userId, id);
    await this.goals.update(userId, id, buildGoalChanges(current, input));
    await this.engagement.readingChanged(userId);
    return this.get(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findGoal(userId, id);
    await this.goals.delete(userId, id);
  }

  withProgress(goal: ReadingGoal, snapshot: ReadingSnapshot): GoalWithProgress {
    return { ...goal, progress: calculateGoalProgress(goal, snapshot, new Date(), this.timeZone) };
  }

  loadSnapshot(userId: string): Promise<DetailedSnapshot> {
    return this.snapshots.load(userId);
  }

  private async findGoal(userId: string, id: string): Promise<ReadingGoal> {
    const goal = await this.goals.findById(userId, id);
    if (!goal) throw AppError.notFound(GOAL_NOT_FOUND);
    return goal;
  }
}
