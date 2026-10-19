import type {
  Activity,
  ActivityComment,
  ActivityType,
  AuthSession,
  Book,
  BookClub,
  ClubMember,
  ClubMemberWithUser,
  ClubRole,
  Conversation,
  ConversationParticipant,
  GoalPeriod,
  GoalType,
  Message,
  ReadingGoal,
  ReadingSession,
  ReadingSessionWithBook,
  ReadingStatus,
  User,
  UserAchievement,
  UserBook,
  UserBookWithBook,
  UserSummary,
} from '../domain/entities';

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  googleId?: string | null;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  bio?: string | null;
  shareActivity?: boolean;
  googleId?: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  search(query: string, excludeUserId: string, limit: number): Promise<UserSummary[]>;
}

export interface AuthSessionRepository {
  create(data: { id: string; userId: string; expiresAt: Date }): Promise<AuthSession>;
  findById(id: string): Promise<AuthSession | null>;
  revoke(id: string): Promise<void>;
}

export interface BookData {
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

export interface BookRepository {
  findById(id: string): Promise<Book | null>;
  findByExternalId(source: string, externalId: string): Promise<Book | null>;
  create(data: BookData): Promise<Book>;
  update(id: string, data: Partial<BookData>): Promise<Book>;
}

export interface LibraryFilters {
  status?: ReadingStatus;
  query?: string;
  favoritesOnly?: boolean;
}

export interface UserBookData {
  status: ReadingStatus;
  totalPages: number;
  currentPage: number;
  rating: number | null;
  isFavorite: boolean;
  review: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface UserBookRepository {
  list(userId: string, filters?: LibraryFilters): Promise<UserBookWithBook[]>;
  findById(userId: string, id: string): Promise<UserBookWithBook | null>;
  findByBook(userId: string, bookId: string): Promise<UserBook | null>;
  create(userId: string, bookId: string, data: UserBookData): Promise<UserBookWithBook>;
  update(
    userId: string,
    id: string,
    data: Partial<UserBookData> & { bookId?: string },
  ): Promise<UserBookWithBook>;
  delete(userId: string, id: string): Promise<void>;
}

export interface ReadingSessionData {
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes: number;
  readAt: Date;
  note: string | null;
}

export interface ReadingSessionFilters {
  userBookId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export interface ReadingSessionRepository {
  list(userId: string, filters: ReadingSessionFilters): Promise<ReadingSessionWithBook[]>;
  findById(userId: string, id: string): Promise<ReadingSession | null>;
  create(userId: string, data: ReadingSessionData): Promise<ReadingSession>;
  update(userId: string, id: string, data: Partial<ReadingSessionData>): Promise<ReadingSession>;
  delete(userId: string, id: string): Promise<void>;
  maxEndPage(userId: string, userBookId: string): Promise<number | null>;
}

export interface ReadingGoalData {
  title: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: Date;
  endDate: Date;
}

export interface ReadingGoalRepository {
  list(userId: string): Promise<ReadingGoal[]>;
  findById(userId: string, id: string): Promise<ReadingGoal | null>;
  create(userId: string, data: ReadingGoalData, clubId?: string): Promise<ReadingGoal>;
  update(userId: string, id: string, data: Partial<ReadingGoalData>): Promise<ReadingGoal>;
  delete(userId: string, id: string): Promise<void>;
  listByClubIds(clubIds: string[]): Promise<ReadingGoal[]>;
  findClubGoal(clubId: string, id: string): Promise<ReadingGoal | null>;
  updateById(id: string, data: Partial<ReadingGoalData>): Promise<ReadingGoal>;
  deleteById(id: string): Promise<void>;
  markCompleted(id: string, completedAt: Date): Promise<void>;
}

export interface FollowRepository {
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  listFollowers(userId: string): Promise<UserSummary[]>;
  listFollowing(userId: string): Promise<UserSummary[]>;
  followingIds(userId: string): Promise<string[]>;
  followerIds(userId: string): Promise<string[]>;
}

export interface ClubData {
  name: string;
  description: string | null;
  currentBookId: string | null;
}

export interface ClubWithMemberCount extends BookClub {
  memberCount: number;
}

export interface ClubRepository {
  create(data: ClubData & { ownerId: string; inviteCode: string }): Promise<BookClub>;
  findById(id: string): Promise<BookClub | null>;
  findByInviteCode(code: string): Promise<BookClub | null>;
  update(id: string, data: Partial<ClubData>): Promise<BookClub>;
  delete(id: string): Promise<void>;
  listForUser(userId: string): Promise<ClubWithMemberCount[]>;
  addMember(clubId: string, userId: string, role: ClubRole): Promise<void>;
  removeMember(clubId: string, userId: string): Promise<void>;
  findMember(clubId: string, userId: string): Promise<ClubMember | null>;
  listMembers(clubId: string): Promise<ClubMemberWithUser[]>;
}

export interface ActivityView {
  activity: Activity;
  user: UserSummary;
  userBook: UserBookWithBook | null;
  goal: ReadingGoal | null;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
}

export interface ActivityData {
  userId: string;
  type: ActivityType;
  userBookId?: string | null;
  goalId?: string | null;
  achievementCode?: string | null;
}

export interface FeedQuery {
  userIds: string[];
  viewerId: string;
  before?: Date;
  limit: number;
}

export interface CommentWithUser extends ActivityComment {
  user: UserSummary;
}

export interface ActivityRepository {
  create(data: ActivityData): Promise<Activity>;
  findById(id: string): Promise<Activity | null>;
  findByUserBookAndType(userBookId: string, type: ActivityType): Promise<Activity | null>;
  bump(id: string, createdAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
  listFeed(query: FeedQuery): Promise<ActivityView[]>;
  findView(id: string, viewerId: string): Promise<ActivityView | null>;
  like(activityId: string, userId: string): Promise<void>;
  unlike(activityId: string, userId: string): Promise<void>;
  listComments(activityId: string): Promise<CommentWithUser[]>;
  addComment(activityId: string, userId: string, body: string): Promise<CommentWithUser>;
  findComment(id: string): Promise<ActivityComment | null>;
  deleteComment(id: string): Promise<void>;
}

export interface AchievementRepository {
  listForUser(userId: string): Promise<UserAchievement[]>;
  unlock(userId: string, code: string, unlockedAt: Date): Promise<boolean>;
  listUnseen(userId: string): Promise<UserAchievement[]>;
  markSeen(userId: string, codes: string[], seenAt: Date): Promise<void>;
}

export interface MessageWithSender extends Message {
  sender: UserSummary;
}

export interface ConversationSummary {
  conversation: Conversation;
  participants: UserSummary[];
  club: { id: string; name: string } | null;
  lastMessage: MessageWithSender | null;
  unreadCount: number;
}

export interface MessageQuery {
  after?: Date;
  before?: Date;
  limit: number;
}

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByDirectKey(directKey: string): Promise<Conversation | null>;
  findByClubId(clubId: string): Promise<Conversation | null>;
  createDirect(directKey: string, userIds: string[]): Promise<Conversation>;
  createForClub(clubId: string, userIds: string[]): Promise<Conversation>;
  addParticipant(conversationId: string, userId: string): Promise<void>;
  removeParticipant(conversationId: string, userId: string): Promise<void>;
  findParticipant(conversationId: string, userId: string): Promise<ConversationParticipant | null>;
  listForUser(userId: string): Promise<ConversationSummary[]>;
  findSummary(conversationId: string, userId: string): Promise<ConversationSummary | null>;
  listMessages(conversationId: string, query: MessageQuery): Promise<MessageWithSender[]>;
  createMessage(conversationId: string, senderId: string, body: string): Promise<MessageWithSender>;
  markRead(conversationId: string, userId: string, readAt: Date): Promise<void>;
}

export interface Repositories {
  users: UserRepository;
  authSessions: AuthSessionRepository;
  books: BookRepository;
  userBooks: UserBookRepository;
  readingSessions: ReadingSessionRepository;
  readingGoals: ReadingGoalRepository;
  follows: FollowRepository;
  clubs: ClubRepository;
  activities: ActivityRepository;
  achievements: AchievementRepository;
  conversations: ConversationRepository;
}
