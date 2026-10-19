import type { AchievementDefinition } from '../domain/achievements';
import { findAchievement } from '../domain/achievements';
import { toDateOnlyKey } from '../domain/calendar';
import type { Book, PublicUser } from '../domain/entities';
import { progressPercentage } from '../domain/readingProgress';
import type {
  ActivityView,
  ClubWithMemberCount,
  CommentWithUser,
  ConversationSummary,
  MessageWithSender,
} from '../repositories/contracts';
import type { AchievementStatus, UnlockedAchievement } from '../services/achievementService';
import type { ClubDetails, ClubGoalWithProgress } from '../services/clubService';
import type { UserProfile, UserWithRelationship } from '../services/socialService';
import { presentLibraryItem } from './presenters';

export const presentMe = (user: PublicUser) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  bio: user.bio,
  shareActivity: user.shareActivity,
  createdAt: user.createdAt,
});

export const presentUserWithRelationship = (user: UserWithRelationship) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  relationship: user.relationship,
});

const presentDefinition = (definition: AchievementDefinition) => ({
  code: definition.code,
  title: definition.title,
  description: definition.description,
  tier: definition.tier,
  threshold: definition.threshold,
});

export const presentUnlockedAchievement = (achievement: UnlockedAchievement) => ({
  ...presentDefinition(achievement.definition),
  unlockedAt: achievement.unlockedAt,
});

export const presentAchievementStatus = (status: AchievementStatus) => ({
  ...presentDefinition(status.definition),
  unlocked: status.unlockedAt !== null,
  unlockedAt: status.unlockedAt,
  currentValue: status.currentValue,
});

export const presentProfile = (profile: UserProfile) => ({
  user: profile.user,
  relationship: profile.relationship,
  stats: profile.stats,
  shelves: profile.shelves,
  currentlyReading: profile.currentlyReading.map(presentLibraryItem),
  recentAchievements: profile.recentAchievements.map(presentUnlockedAchievement),
});

export const presentActivity = (view: ActivityView) => {
  const { activity, userBook, goal } = view;
  const achievement = activity.achievementCode ? findAchievement(activity.achievementCode) : null;
  return {
    id: activity.id,
    type: activity.type,
    createdAt: activity.createdAt,
    user: view.user,
    book: userBook
      ? {
          userBookId: userBook.id,
          title: userBook.book.title,
          authors: userBook.book.authors,
          coverUrl: userBook.book.coverUrl,
          status: userBook.status,
          rating: userBook.rating,
          progress: progressPercentage(userBook.currentPage, userBook.totalPages),
          review: activity.type === 'REVIEW_POSTED' ? userBook.review : null,
        }
      : null,
    goal: goal
      ? {
          id: goal.id,
          title: goal.title,
          type: goal.type,
          targetValue: goal.targetValue,
          isClubGoal: goal.clubId !== null,
        }
      : null,
    achievement: achievement ? presentDefinition(achievement) : null,
    likeCount: view.likeCount,
    commentCount: view.commentCount,
    likedByMe: view.likedByViewer,
  };
};

export const presentComment = (comment: CommentWithUser) => ({
  id: comment.id,
  activityId: comment.activityId,
  body: comment.body,
  createdAt: comment.createdAt,
  user: comment.user,
});

const presentBookSummary = (book: Book | null) =>
  book ? { id: book.id, title: book.title, authors: book.authors, coverUrl: book.coverUrl } : null;

export const presentClubSummary = (club: ClubWithMemberCount, viewerId: string) => ({
  id: club.id,
  name: club.name,
  description: club.description,
  memberCount: club.memberCount,
  isOwner: club.ownerId === viewerId,
  createdAt: club.createdAt,
});

const presentClubGoal = (goal: ClubGoalWithProgress) => ({
  id: goal.id,
  title: goal.title,
  type: goal.type,
  period: goal.period,
  targetValue: goal.targetValue,
  startDate: toDateOnlyKey(goal.startDate),
  endDate: toDateOnlyKey(goal.endDate),
  currentValue: goal.progress.currentValue,
  percentage: goal.progress.percentage,
  state: goal.progress.state,
  completedAt: goal.completedAt,
  contributions: goal.contributions,
});

export const presentClubDetails = (details: ClubDetails) => ({
  id: details.club.id,
  name: details.club.name,
  description: details.club.description,
  inviteCode: details.club.inviteCode,
  ownerId: details.club.ownerId,
  viewerRole: details.viewerRole,
  currentBook: presentBookSummary(details.currentBook),
  members: details.members.map((member) => ({
    ...member.user,
    role: member.role,
    joinedAt: member.joinedAt,
  })),
  goals: details.goals.map(presentClubGoal),
  conversationId: details.conversationId,
  createdAt: details.club.createdAt,
});

export const presentMessage = (message: MessageWithSender) => ({
  id: message.id,
  conversationId: message.conversationId,
  body: message.body,
  createdAt: message.createdAt,
  sender: message.sender,
});

export const presentConversation = (summary: ConversationSummary) => ({
  id: summary.conversation.id,
  type: summary.conversation.type,
  club: summary.club,
  participants: summary.participants,
  lastMessage: summary.lastMessage ? presentMessage(summary.lastMessage) : null,
  unreadCount: summary.unreadCount,
  updatedAt: summary.conversation.updatedAt,
});
