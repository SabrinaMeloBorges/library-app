export const READING_STATUSES = [
  'WANT_TO_READ',
  'READING',
  'FINISHED',
  'PAUSED',
  'ABANDONED',
] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const GOAL_TYPES = ['BOOKS_FINISHED', 'PAGES_READ', 'MINUTES_READ', 'READING_DAYS'] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

export const ACTIVITY_TYPES = [
  'BOOK_STARTED',
  'BOOK_FINISHED',
  'REVIEW_POSTED',
  'GOAL_COMPLETED',
  'ACHIEVEMENT_UNLOCKED',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type ClubRole = 'OWNER' | 'MEMBER';
export type ConversationType = 'DIRECT' | 'CLUB';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  googleId: string | null;
  bio: string | null;
  shareActivity: boolean;
  createdAt: Date;
}

export type PublicUser = Omit<User, 'passwordHash' | 'googleId'>;

export interface UserSummary {
  id: string;
  name: string;
  username: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface Book {
  id: string;
  title: string;
  authors: string;
  publisher: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  isbn: string | null;
  description: string | null;
  subjects: string | null;
  externalSource: string | null;
  externalId: string | null;
  createdByUserId: string | null;
}

export interface UserBook {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  totalPages: number;
  currentPage: number;
  rating: number | null;
  isFavorite: boolean;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserBookWithBook extends UserBook {
  book: Book;
}

export interface ReadingSession {
  id: string;
  userId: string;
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes: number;
  readAt: Date;
  note: string | null;
  createdAt: Date;
}

export interface ReadingSessionWithBook extends ReadingSession {
  bookTitle: string;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  clubId: string | null;
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: Date;
  endDate: Date;
  completedAt: Date | null;
  createdAt: Date;
}

export interface BookClub {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  currentBookId: string | null;
  createdAt: Date;
}

export interface ClubMember {
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: Date;
}

export interface ClubMemberWithUser extends ClubMember {
  user: UserSummary;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  userBookId: string | null;
  goalId: string | null;
  achievementCode: string | null;
  createdAt: Date;
}

export interface ActivityComment {
  id: string;
  activityId: string;
  userId: string;
  body: string;
  createdAt: Date;
}

export interface UserAchievement {
  userId: string;
  code: string;
  unlockedAt: Date;
  seenAt: Date | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  clubId: string | null;
  directKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  conversationId: string;
  userId: string;
  lastReadAt: Date | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}
