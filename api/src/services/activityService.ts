import type { ActivityType, UserBook, UserBookWithBook } from '../domain/entities';
import { AppError } from '../errors/AppError';
import type {
  ActivityRepository,
  ActivityView,
  CommentWithUser,
  FollowRepository,
  UserRepository,
} from '../repositories/contracts';

const ACTIVITY_NOT_FOUND = 'Atividade não encontrada';
const FEED_PAGE_SIZE = 20;

type BookSnapshot = Pick<UserBook, 'status' | 'review'> | null;

export class ActivityService {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly follows: FollowRepository,
    private readonly users: UserRepository,
  ) {}

  async recordBookProgress(
    userId: string,
    before: BookSnapshot,
    after: UserBookWithBook,
  ): Promise<void> {
    if (!(await this.isSharing(userId))) return;

    if (after.status === 'READING' && before?.status !== 'READING') {
      await this.createOnce(userId, after.id, 'BOOK_STARTED');
    }
    if (after.status === 'FINISHED' && before?.status !== 'FINISHED') {
      await this.createOnce(userId, after.id, 'BOOK_FINISHED');
    }
    if (after.review !== (before?.review ?? null)) {
      await this.syncReview(userId, after);
    }
  }

  async recordGoalCompleted(userId: string, goalId: string): Promise<void> {
    if (await this.isSharing(userId)) {
      await this.activities.create({ userId, type: 'GOAL_COMPLETED', goalId });
    }
  }

  async recordAchievement(userId: string, achievementCode: string): Promise<void> {
    if (await this.isSharing(userId)) {
      await this.activities.create({ userId, type: 'ACHIEVEMENT_UNLOCKED', achievementCode });
    }
  }

  async feed(viewerId: string, before?: Date, limit = FEED_PAGE_SIZE): Promise<ActivityView[]> {
    const followingIds = await this.follows.followingIds(viewerId);
    return this.activities.listFeed({
      userIds: [viewerId, ...followingIds],
      viewerId,
      before,
      limit,
    });
  }

  async userActivities(
    viewerId: string,
    userId: string,
    before?: Date,
    limit = FEED_PAGE_SIZE,
  ): Promise<ActivityView[]> {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.notFound('Usuário não encontrado');
    return this.activities.listFeed({ userIds: [userId], viewerId, before, limit });
  }

  async like(viewerId: string, activityId: string): Promise<ActivityView> {
    await this.requireActivity(activityId);
    await this.activities.like(activityId, viewerId);
    return this.view(viewerId, activityId);
  }

  async unlike(viewerId: string, activityId: string): Promise<ActivityView> {
    await this.requireActivity(activityId);
    await this.activities.unlike(activityId, viewerId);
    return this.view(viewerId, activityId);
  }

  async comments(activityId: string): Promise<CommentWithUser[]> {
    await this.requireActivity(activityId);
    return this.activities.listComments(activityId);
  }

  async addComment(viewerId: string, activityId: string, body: string): Promise<CommentWithUser> {
    await this.requireActivity(activityId);
    return this.activities.addComment(activityId, viewerId, body);
  }

  async deleteComment(viewerId: string, activityId: string, commentId: string): Promise<void> {
    const activity = await this.requireActivity(activityId);
    const comment = await this.activities.findComment(commentId);
    if (!comment || comment.activityId !== activityId) {
      throw AppError.notFound('Comentário não encontrado');
    }
    const canDelete = comment.userId === viewerId || activity.userId === viewerId;
    if (!canDelete) throw new AppError(403, 'FORBIDDEN', 'Você não pode excluir este comentário');
    await this.activities.deleteComment(commentId);
  }

  private async view(viewerId: string, activityId: string): Promise<ActivityView> {
    const view = await this.activities.findView(activityId, viewerId);
    if (!view) throw AppError.notFound(ACTIVITY_NOT_FOUND);
    return view;
  }

  private async requireActivity(activityId: string) {
    const activity = await this.activities.findById(activityId);
    if (!activity) throw AppError.notFound(ACTIVITY_NOT_FOUND);
    return activity;
  }

  private async isSharing(userId: string): Promise<boolean> {
    const user = await this.users.findById(userId);
    return user?.shareActivity ?? false;
  }

  private async createOnce(userId: string, userBookId: string, type: ActivityType): Promise<void> {
    const existing = await this.activities.findByUserBookAndType(userBookId, type);
    if (!existing) await this.activities.create({ userId, type, userBookId });
  }

  private async syncReview(userId: string, userBook: UserBookWithBook): Promise<void> {
    const existing = await this.activities.findByUserBookAndType(userBook.id, 'REVIEW_POSTED');
    if (!userBook.review) {
      if (existing) await this.activities.delete(existing.id);
      return;
    }
    if (existing) await this.activities.bump(existing.id, new Date());
    else await this.activities.create({ userId, type: 'REVIEW_POSTED', userBookId: userBook.id });
  }
}
