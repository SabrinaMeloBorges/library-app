import {
  READING_STATUSES,
  type PublicUser,
  type ReadingStatus,
  type UserBookWithBook,
  type UserSummary,
} from '../domain/entities';
import { countUniquePagesRead } from '../domain/readingMetrics';
import { AppError } from '../errors/AppError';
import type { FollowRepository, UserRepository } from '../repositories/contracts';
import type { UpdateProfileInput } from '../validators/socialValidators';
import type { AchievementService, UnlockedAchievement } from './achievementService';
import { toPublicUser } from './authService';
import type { EngagementHooks } from './engagementService';
import type { ReadingSnapshotService } from './readingSnapshotService';
import { ensureUsernameAvailable } from './usernames';

const SEARCH_LIMIT = 20;
const CURRENTLY_READING_LIMIT = 3;
const RECENT_ACHIEVEMENTS_LIMIT = 6;
const USER_NOT_FOUND = 'Usuário não encontrado';

export interface Relationship {
  isMe: boolean;
  isFollowing: boolean;
  followsYou: boolean;
  isFriend: boolean;
}

export interface UserWithRelationship extends UserSummary {
  relationship: Relationship;
}

export interface UserProfile {
  user: Omit<PublicUser, 'email' | 'shareActivity'>;
  relationship: Relationship;
  stats: {
    totalBooks: number;
    booksFinished: number;
    pagesRead: number;
    followers: number;
    following: number;
    achievements: number;
  };
  shelves: Record<ReadingStatus, number>;
  currentlyReading: UserBookWithBook[];
  recentAchievements: UnlockedAchievement[];
}

const countShelves = (userBooks: UserBookWithBook[]): Record<ReadingStatus, number> => {
  const shelves = Object.fromEntries(READING_STATUSES.map((status) => [status, 0])) as Record<
    ReadingStatus,
    number
  >;
  for (const item of userBooks) shelves[item.status] += 1;
  return shelves;
};

export class SocialService {
  constructor(
    private readonly users: UserRepository,
    private readonly follows: FollowRepository,
    private readonly snapshots: ReadingSnapshotService,
    private readonly achievements: AchievementService,
    private readonly engagement: EngagementHooks,
  ) {}

  async search(viewerId: string, query: string): Promise<UserWithRelationship[]> {
    const results = await this.users.search(query, viewerId, SEARCH_LIMIT);
    return this.withRelationships(viewerId, results);
  }

  async profile(viewerId: string, userId: string): Promise<UserProfile> {
    const user = await this.requireUser(userId);
    const [snapshot, followerIds, followingIds, unlocked, relationship] = await Promise.all([
      this.snapshots.load(userId),
      this.follows.followerIds(userId),
      this.follows.followingIds(userId),
      this.achievements.listUnlocked(userId),
      this.relationship(viewerId, userId),
    ]);
    const { email: _email, shareActivity: _share, ...publicFields } = toPublicUser(user);

    return {
      user: publicFields,
      relationship,
      stats: {
        totalBooks: snapshot.userBooks.length,
        booksFinished: snapshot.userBooks.filter((item) => item.status === 'FINISHED').length,
        pagesRead: countUniquePagesRead(snapshot.sessions),
        followers: followerIds.length,
        following: followingIds.length,
        achievements: unlocked.length,
      },
      shelves: countShelves(snapshot.userBooks),
      currentlyReading: snapshot.userBooks
        .filter((item) => item.status === 'READING')
        .slice(0, CURRENTLY_READING_LIMIT),
      recentAchievements: [...unlocked]
        .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
        .slice(0, RECENT_ACHIEVEMENTS_LIMIT),
    };
  }

  async updateMe(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    await this.requireUser(userId);
    if (input.username) await ensureUsernameAvailable(this.users, input.username, userId);
    return toPublicUser(await this.users.update(userId, input));
  }

  async follow(viewerId: string, userId: string): Promise<Relationship> {
    if (viewerId === userId) throw AppError.validation('Você não pode seguir a si mesmo');
    await this.requireUser(userId);
    await this.follows.follow(viewerId, userId);
    await this.engagement.usersChanged([viewerId, userId]);
    return this.relationship(viewerId, userId);
  }

  async unfollow(viewerId: string, userId: string): Promise<Relationship> {
    await this.requireUser(userId);
    await this.follows.unfollow(viewerId, userId);
    return this.relationship(viewerId, userId);
  }

  async followers(viewerId: string, userId: string): Promise<UserWithRelationship[]> {
    await this.requireUser(userId);
    return this.withRelationships(viewerId, await this.follows.listFollowers(userId));
  }

  async following(viewerId: string, userId: string): Promise<UserWithRelationship[]> {
    await this.requireUser(userId);
    return this.withRelationships(viewerId, await this.follows.listFollowing(userId));
  }

  async friends(userId: string): Promise<UserSummary[]> {
    const [following, followerIds] = await Promise.all([
      this.follows.listFollowing(userId),
      this.follows.followerIds(userId),
    ]);
    const followers = new Set(followerIds);
    return following.filter((user) => followers.has(user.id));
  }

  async areFriends(firstId: string, secondId: string): Promise<boolean> {
    const [forward, backward] = await Promise.all([
      this.follows.isFollowing(firstId, secondId),
      this.follows.isFollowing(secondId, firstId),
    ]);
    return forward && backward;
  }

  private async relationship(viewerId: string, userId: string): Promise<Relationship> {
    if (viewerId === userId) {
      return { isMe: true, isFollowing: false, followsYou: false, isFriend: false };
    }
    const [isFollowing, followsYou] = await Promise.all([
      this.follows.isFollowing(viewerId, userId),
      this.follows.isFollowing(userId, viewerId),
    ]);
    return { isMe: false, isFollowing, followsYou, isFriend: isFollowing && followsYou };
  }

  private async withRelationships(
    viewerId: string,
    users: UserSummary[],
  ): Promise<UserWithRelationship[]> {
    const [followingIds, followerIds] = await Promise.all([
      this.follows.followingIds(viewerId),
      this.follows.followerIds(viewerId),
    ]);
    const following = new Set(followingIds);
    const followers = new Set(followerIds);
    return users.map((user) => {
      const isMe = user.id === viewerId;
      const isFollowing = !isMe && following.has(user.id);
      const followsYou = !isMe && followers.has(user.id);
      return {
        ...user,
        relationship: { isMe, isFollowing, followsYou, isFriend: isFollowing && followsYou },
      };
    });
  }

  private async requireUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw AppError.notFound(USER_NOT_FOUND);
    return user;
  }
}
