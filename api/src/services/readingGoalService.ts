import { parseDateOnly, toDateOnlyKey } from '../domain/calendar';
import type { ReadingGoal, ReadingSessionWithBook, UserBookWithBook } from '../domain/entities';
import { calculateGoalProgress, type GoalProgress } from '../domain/goalProgress';
import type { ReadingSnapshot } from '../domain/readingMetrics';
import { AppError } from '../errors/AppError';
import type {
  ReadingGoalData,
  ReadingGoalRepository,
  ReadingSessionRepository,
  UserBookRepository,
} from '../repositories/contracts';
import type { CreateGoalInput, UpdateGoalInput } from '../validators/goalValidators';

const GOAL_NOT_FOUND = 'Meta não encontrada';

export interface GoalWithProgress extends ReadingGoal {
  progress: GoalProgress;
}

export interface DetailedSnapshot extends ReadingSnapshot {
  sessions: ReadingSessionWithBook[];
  userBooks: UserBookWithBook[];
}

export class ReadingGoalService {
  constructor(
    private readonly goals: ReadingGoalRepository,
    private readonly sessions: ReadingSessionRepository,
    private readonly userBooks: UserBookRepository,
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
    const goal = await this.goals.create(userId, {
      ...input,
      startDate: parseDateOnly(input.startDate),
      endDate: parseDateOnly(input.endDate),
    });
    return this.withProgress(goal, await this.loadSnapshot(userId));
  }

  async update(userId: string, id: string, input: UpdateGoalInput): Promise<GoalWithProgress> {
    const current = await this.findGoal(userId, id);
    const startDate = input.startDate ?? toDateOnlyKey(current.startDate);
    const endDate = input.endDate ?? toDateOnlyKey(current.endDate);
    if (endDate < startDate) {
      throw AppError.validation('A data de término deve ser igual ou posterior à data de início', [
        {
          field: 'endDate',
          message: 'A data de término deve ser igual ou posterior à data de início',
        },
      ]);
    }

    const { startDate: _start, endDate: _end, ...rest } = input;
    const changes: Partial<ReadingGoalData> = {
      ...rest,
      ...(input.startDate ? { startDate: parseDateOnly(input.startDate) } : {}),
      ...(input.endDate ? { endDate: parseDateOnly(input.endDate) } : {}),
    };
    const goal = await this.goals.update(userId, id, changes);
    return this.withProgress(goal, await this.loadSnapshot(userId));
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findGoal(userId, id);
    await this.goals.delete(userId, id);
  }

  withProgress(goal: ReadingGoal, snapshot: ReadingSnapshot): GoalWithProgress {
    return { ...goal, progress: calculateGoalProgress(goal, snapshot, new Date(), this.timeZone) };
  }

  async loadSnapshot(userId: string): Promise<DetailedSnapshot> {
    const [sessions, userBooks] = await Promise.all([
      this.sessions.list(userId, {}),
      this.userBooks.list(userId),
    ]);
    return { sessions, userBooks };
  }

  private async findGoal(userId: string, id: string): Promise<ReadingGoal> {
    const goal = await this.goals.findById(userId, id);
    if (!goal) throw AppError.notFound(GOAL_NOT_FOUND);
    return goal;
  }
}
