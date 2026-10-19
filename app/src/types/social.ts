import type { GoalPeriod, GoalState, GoalType, LibraryItem, ReadingStatus } from './api';

export interface UserSummary {
  id: string;
  name: string;
  username: string;
}

export interface Relationship {
  isMe: boolean;
  isFollowing: boolean;
  followsYou: boolean;
  isFriend: boolean;
}

export interface UserWithRelationship extends UserSummary {
  relationship: Relationship;
}

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface AchievementInfo {
  code: string;
  title: string;
  description: string;
  tier: AchievementTier;
  threshold: number;
}

export interface UnlockedAchievement extends AchievementInfo {
  unlockedAt: string;
}

export interface AchievementStatus extends AchievementInfo {
  unlocked: boolean;
  unlockedAt: string | null;
  currentValue: number;
}

export interface UserProfile {
  user: UserSummary & { bio: string | null; createdAt: string };
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
  currentlyReading: LibraryItem[];
  recentAchievements: UnlockedAchievement[];
}

export type ActivityType =
  'BOOK_STARTED' | 'BOOK_FINISHED' | 'REVIEW_POSTED' | 'GOAL_COMPLETED' | 'ACHIEVEMENT_UNLOCKED';

export interface FeedActivity {
  id: string;
  type: ActivityType;
  createdAt: string;
  user: UserSummary;
  book: {
    userBookId: string;
    title: string;
    authors: string;
    coverUrl: string | null;
    status: ReadingStatus;
    rating: number | null;
    progress: number;
    review: string | null;
  } | null;
  goal: {
    id: string;
    title: string;
    type: GoalType;
    targetValue: number;
    isClubGoal: boolean;
  } | null;
  achievement: AchievementInfo | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface ActivityComment {
  id: string;
  activityId: string;
  body: string;
  createdAt: string;
  user: UserSummary;
}

export interface ClubSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isOwner: boolean;
  createdAt: string;
}

export interface ClubGoal {
  id: string;
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: string;
  endDate: string;
  currentValue: number;
  percentage: number;
  state: GoalState;
  completedAt: string | null;
  contributions: { user: UserSummary; value: number }[];
}

export interface ClubDetails {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  viewerRole: 'OWNER' | 'MEMBER';
  currentBook: { id: string; title: string; authors: string; coverUrl: string | null } | null;
  members: (UserSummary & { role: 'OWNER' | 'MEMBER'; joinedAt: string })[];
  goals: ClubGoal[];
  conversationId: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  createdAt: string;
  sender: UserSummary;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'CLUB';
  club: { id: string; name: string } | null;
  participants: UserSummary[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}
