import { randomUUID } from 'node:crypto';
import type {
  Activity,
  ActivityComment,
  BookClub,
  Conversation,
  Message,
  UserBookWithBook,
} from '../../domain/entities';
import type {
  AchievementRepository,
  ActivityRepository,
  ActivityView,
  ClubRepository,
  ConversationRepository,
  ConversationSummary,
  FollowRepository,
  MessageWithSender,
  Repositories,
} from '../contracts';
import { deleteWhere, pairKey, toUserSummary, type MemoryStore } from './store';

type SocialRepositories = Pick<
  Repositories,
  'follows' | 'clubs' | 'activities' | 'achievements' | 'conversations'
>;

const byNewest = (a: { createdAt: Date }, b: { createdAt: Date }): number =>
  b.createdAt.getTime() - a.createdAt.getTime();

const createFollowRepository = (store: MemoryStore): FollowRepository => {
  const records = () => [...store.follows.values()];
  return {
    follow: async (followerId, followingId) => {
      const key = pairKey(followerId, followingId);
      if (!store.follows.has(key)) {
        store.follows.set(key, { followerId, followingId, createdAt: new Date() });
      }
    },
    unfollow: async (followerId, followingId) => {
      store.follows.delete(pairKey(followerId, followingId));
    },
    isFollowing: async (followerId, followingId) =>
      store.follows.has(pairKey(followerId, followingId)),
    listFollowers: async (userId) =>
      records()
        .filter((record) => record.followingId === userId)
        .sort(byNewest)
        .map((record) => toUserSummary(store, record.followerId)),
    listFollowing: async (userId) =>
      records()
        .filter((record) => record.followerId === userId)
        .sort(byNewest)
        .map((record) => toUserSummary(store, record.followingId)),
    followingIds: async (userId) =>
      records()
        .filter((record) => record.followerId === userId)
        .map((record) => record.followingId),
    followerIds: async (userId) =>
      records()
        .filter((record) => record.followingId === userId)
        .map((record) => record.followerId),
  };
};

const createClubRepository = (store: MemoryStore): ClubRepository => {
  const toClub = ({ updatedAt: _updatedAt, ...club }: BookClub & { updatedAt: Date }): BookClub =>
    club;
  const members = () => [...store.clubMembers.values()];

  return {
    create: async (data) => {
      const now = new Date();
      const club = { id: randomUUID(), createdAt: now, updatedAt: now, ...data };
      store.clubs.set(club.id, club);
      return toClub(club);
    },
    findById: async (id) => {
      const club = store.clubs.get(id);
      return club ? toClub(club) : null;
    },
    findByInviteCode: async (code) => {
      const club = [...store.clubs.values()].find((item) => item.inviteCode === code);
      return club ? toClub(club) : null;
    },
    update: async (id, data) => {
      const current = store.clubs.get(id);
      if (!current) throw new Error('Clube não encontrado');
      const updated = { ...current, ...data, updatedAt: new Date() };
      store.clubs.set(id, updated);
      return toClub(updated);
    },
    delete: async (id) => {
      store.clubs.delete(id);
      deleteWhere(store.clubMembers, (member) => member.clubId === id);
      const goalIds = [...store.readingGoals.values()]
        .filter((goal) => goal.clubId === id)
        .map((goal) => goal.id);
      deleteWhere(store.readingGoals, (goal) => goal.clubId === id);
      deleteWhere(store.activities, (activity) => goalIds.includes(activity.goalId ?? ''));
      const conversationIds = [...store.conversations.values()]
        .filter((conversation) => conversation.clubId === id)
        .map((conversation) => conversation.id);
      deleteWhere(store.conversations, (conversation) => conversation.clubId === id);
      deleteWhere(store.participants, (item) => conversationIds.includes(item.conversationId));
      deleteWhere(store.messages, (item) => conversationIds.includes(item.conversationId));
    },
    listForUser: async (userId) => {
      const clubIds = members()
        .filter((member) => member.userId === userId)
        .map((member) => member.clubId);
      return [...store.clubs.values()]
        .filter((club) => clubIds.includes(club.id))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map((club) => ({
          ...toClub(club),
          memberCount: members().filter((member) => member.clubId === club.id).length,
        }));
    },
    addMember: async (clubId, userId, role) => {
      const key = pairKey(clubId, userId);
      if (!store.clubMembers.has(key)) {
        store.clubMembers.set(key, { clubId, userId, role, joinedAt: new Date() });
      }
    },
    removeMember: async (clubId, userId) => {
      store.clubMembers.delete(pairKey(clubId, userId));
    },
    findMember: async (clubId, userId) => store.clubMembers.get(pairKey(clubId, userId)) ?? null,
    listMembers: async (clubId) =>
      members()
        .filter((member) => member.clubId === clubId)
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
        .map((member) => ({ ...member, user: toUserSummary(store, member.userId) })),
  };
};

const createActivityRepository = (store: MemoryStore): ActivityRepository => {
  const userBookWithBook = (userBookId: string | null): UserBookWithBook | null => {
    const userBook = userBookId ? store.userBooks.get(userBookId) : undefined;
    const book = userBook ? store.books.get(userBook.bookId) : undefined;
    return userBook && book ? { ...userBook, book } : null;
  };

  const toView = (activity: Activity, viewerId: string): ActivityView => {
    const likes = [...store.activityLikes.values()].filter(
      (like) => like.activityId === activity.id,
    );
    return {
      activity,
      user: toUserSummary(store, activity.userId),
      userBook: userBookWithBook(activity.userBookId),
      goal: activity.goalId ? (store.readingGoals.get(activity.goalId) ?? null) : null,
      likeCount: likes.length,
      commentCount: [...store.activityComments.values()].filter(
        (comment) => comment.activityId === activity.id,
      ).length,
      likedByViewer: likes.some((like) => like.userId === viewerId),
    };
  };

  return {
    create: async (data) => {
      const activity: Activity = {
        id: randomUUID(),
        userId: data.userId,
        type: data.type,
        userBookId: data.userBookId ?? null,
        goalId: data.goalId ?? null,
        achievementCode: data.achievementCode ?? null,
        createdAt: new Date(),
      };
      store.activities.set(activity.id, activity);
      return activity;
    },
    findById: async (id) => store.activities.get(id) ?? null,
    findByUserBookAndType: async (userBookId, type) =>
      [...store.activities.values()].find(
        (activity) => activity.userBookId === userBookId && activity.type === type,
      ) ?? null,
    bump: async (id, createdAt) => {
      const activity = store.activities.get(id);
      if (activity) store.activities.set(id, { ...activity, createdAt });
    },
    delete: async (id) => {
      store.activities.delete(id);
      deleteWhere(store.activityLikes, (like) => like.activityId === id);
      deleteWhere(store.activityComments, (comment) => comment.activityId === id);
    },
    listFeed: async ({ userIds, viewerId, before, limit }) =>
      [...store.activities.values()]
        .filter((activity) => userIds.includes(activity.userId))
        .filter((activity) => !before || activity.createdAt < before)
        .sort(byNewest)
        .slice(0, limit)
        .map((activity) => toView(activity, viewerId)),
    findView: async (id, viewerId) => {
      const activity = store.activities.get(id);
      return activity ? toView(activity, viewerId) : null;
    },
    like: async (activityId, userId) => {
      store.activityLikes.set(pairKey(activityId, userId), { activityId, userId });
    },
    unlike: async (activityId, userId) => {
      store.activityLikes.delete(pairKey(activityId, userId));
    },
    listComments: async (activityId) =>
      [...store.activityComments.values()]
        .filter((comment) => comment.activityId === activityId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((comment) => ({ ...comment, user: toUserSummary(store, comment.userId) })),
    addComment: async (activityId, userId, body) => {
      const comment: ActivityComment = {
        id: randomUUID(),
        activityId,
        userId,
        body,
        createdAt: new Date(),
      };
      store.activityComments.set(comment.id, comment);
      return { ...comment, user: toUserSummary(store, userId) };
    },
    findComment: async (id) => store.activityComments.get(id) ?? null,
    deleteComment: async (id) => {
      store.activityComments.delete(id);
    },
  };
};

const createAchievementRepository = (store: MemoryStore): AchievementRepository => {
  const ofUser = (userId: string) =>
    [...store.achievements.values()]
      .filter((achievement) => achievement.userId === userId)
      .sort((a, b) => a.unlockedAt.getTime() - b.unlockedAt.getTime());

  return {
    listForUser: async (userId) => ofUser(userId),
    unlock: async (userId, code, unlockedAt) => {
      const key = pairKey(userId, code);
      if (store.achievements.has(key)) return false;
      store.achievements.set(key, { userId, code, unlockedAt, seenAt: null });
      return true;
    },
    listUnseen: async (userId) => ofUser(userId).filter((achievement) => !achievement.seenAt),
    markSeen: async (userId, codes, seenAt) => {
      for (const code of codes) {
        const key = pairKey(userId, code);
        const achievement = store.achievements.get(key);
        if (achievement && !achievement.seenAt)
          store.achievements.set(key, { ...achievement, seenAt });
      }
    },
  };
};

const createConversationRepository = (store: MemoryStore): ConversationRepository => {
  const participantsOf = (conversationId: string) =>
    [...store.participants.values()].filter((item) => item.conversationId === conversationId);

  const withSender = (message: Message): MessageWithSender => ({
    ...message,
    sender: toUserSummary(store, message.senderId),
  });

  const messagesOf = (conversationId: string) =>
    [...store.messages.values()]
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const create = (
    data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>,
    userIds: string[],
  ) => {
    const now = new Date();
    const conversation: Conversation = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    store.conversations.set(conversation.id, conversation);
    for (const userId of userIds) {
      store.participants.set(pairKey(conversation.id, userId), {
        conversationId: conversation.id,
        userId,
        lastReadAt: null,
      });
    }
    return conversation;
  };

  const toSummary = (conversation: Conversation, userId: string): ConversationSummary => {
    const own = store.participants.get(pairKey(conversation.id, userId));
    const messages = messagesOf(conversation.id);
    const last = messages[messages.length - 1];
    const club = conversation.clubId ? store.clubs.get(conversation.clubId) : undefined;
    return {
      conversation,
      participants: participantsOf(conversation.id).map((item) =>
        toUserSummary(store, item.userId),
      ),
      club: club ? { id: club.id, name: club.name } : null,
      lastMessage: last ? withSender(last) : null,
      unreadCount: messages.filter(
        (message) =>
          message.senderId !== userId && (!own?.lastReadAt || message.createdAt > own.lastReadAt),
      ).length,
    };
  };

  return {
    findById: async (id) => store.conversations.get(id) ?? null,
    findByDirectKey: async (directKey) =>
      [...store.conversations.values()].find((item) => item.directKey === directKey) ?? null,
    findByClubId: async (clubId) =>
      [...store.conversations.values()].find((item) => item.clubId === clubId) ?? null,
    createDirect: async (directKey, userIds) =>
      create({ type: 'DIRECT', directKey, clubId: null }, userIds),
    createForClub: async (clubId, userIds) =>
      create({ type: 'CLUB', directKey: null, clubId }, userIds),
    addParticipant: async (conversationId, userId) => {
      const key = pairKey(conversationId, userId);
      if (!store.participants.has(key)) {
        store.participants.set(key, { conversationId, userId, lastReadAt: null });
      }
    },
    removeParticipant: async (conversationId, userId) => {
      store.participants.delete(pairKey(conversationId, userId));
    },
    findParticipant: async (conversationId, userId) =>
      store.participants.get(pairKey(conversationId, userId)) ?? null,
    listForUser: async (userId) =>
      [...store.conversations.values()]
        .filter((conversation) => store.participants.has(pairKey(conversation.id, userId)))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .map((conversation) => toSummary(conversation, userId)),
    findSummary: async (conversationId, userId) => {
      const conversation = store.conversations.get(conversationId);
      if (!conversation || !store.participants.has(pairKey(conversationId, userId))) return null;
      return toSummary(conversation, userId);
    },
    listMessages: async (conversationId, { after, before, limit }) => {
      const messages = messagesOf(conversationId);
      if (after) {
        return messages
          .filter((message) => message.createdAt > after)
          .slice(0, limit)
          .map(withSender);
      }
      return messages
        .filter((message) => !before || message.createdAt < before)
        .slice(-limit)
        .map(withSender);
    },
    createMessage: async (conversationId, senderId, body) => {
      const message: Message = {
        id: randomUUID(),
        conversationId,
        senderId,
        body,
        createdAt: new Date(),
      };
      store.messages.set(message.id, message);
      const conversation = store.conversations.get(conversationId);
      if (conversation)
        store.conversations.set(conversationId, { ...conversation, updatedAt: new Date() });
      return withSender(message);
    },
    markRead: async (conversationId, userId, readAt) => {
      const key = pairKey(conversationId, userId);
      const participant = store.participants.get(key);
      if (participant) store.participants.set(key, { ...participant, lastReadAt: readAt });
    },
  };
};

export const createMemorySocialRepositories = (store: MemoryStore): SocialRepositories => ({
  follows: createFollowRepository(store),
  clubs: createClubRepository(store),
  activities: createActivityRepository(store),
  achievements: createAchievementRepository(store),
  conversations: createConversationRepository(store),
});
