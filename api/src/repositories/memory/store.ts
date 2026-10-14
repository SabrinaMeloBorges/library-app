import type {
  Activity,
  ActivityComment,
  AuthSession,
  Book,
  BookClub,
  ClubMember,
  Conversation,
  ConversationParticipant,
  Message,
  ReadingGoal,
  ReadingSession,
  User,
  UserAchievement,
  UserBook,
  UserSummary,
} from '../../domain/entities';

export interface FollowRecord {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface LikeRecord {
  activityId: string;
  userId: string;
}

export interface MemoryStore {
  users: Map<string, User>;
  authSessions: Map<string, AuthSession>;
  books: Map<string, Book>;
  userBooks: Map<string, UserBook>;
  readingSessions: Map<string, ReadingSession>;
  readingGoals: Map<string, ReadingGoal>;
  follows: Map<string, FollowRecord>;
  clubs: Map<string, BookClub & { updatedAt: Date }>;
  clubMembers: Map<string, ClubMember>;
  activities: Map<string, Activity>;
  activityLikes: Map<string, LikeRecord>;
  activityComments: Map<string, ActivityComment>;
  achievements: Map<string, UserAchievement>;
  conversations: Map<string, Conversation>;
  participants: Map<string, ConversationParticipant>;
  messages: Map<string, Message>;
}

export const createStore = (): MemoryStore => ({
  users: new Map(),
  authSessions: new Map(),
  books: new Map(),
  userBooks: new Map(),
  readingSessions: new Map(),
  readingGoals: new Map(),
  follows: new Map(),
  clubs: new Map(),
  clubMembers: new Map(),
  activities: new Map(),
  activityLikes: new Map(),
  activityComments: new Map(),
  achievements: new Map(),
  conversations: new Map(),
  participants: new Map(),
  messages: new Map(),
});

export const pairKey = (first: string, second: string): string => `${first}:${second}`;

export const requireOwned = <T extends { userId: string }>(
  map: Map<string, T>,
  userId: string,
  id: string,
): T => {
  const item = map.get(id);
  if (!item || item.userId !== userId) throw new Error('Registro não encontrado para o usuário');
  return item;
};

export const toUserSummary = (store: MemoryStore, userId: string): UserSummary => {
  const user = store.users.get(userId);
  if (!user) throw new Error('Usuário não encontrado');
  return { id: user.id, name: user.name, username: user.username };
};

export const deleteWhere = <T>(map: Map<string, T>, predicate: (item: T) => boolean): void => {
  for (const [key, item] of map) {
    if (predicate(item)) map.delete(key);
  }
};
