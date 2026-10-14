import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  AchievementRepository,
  ActivityRepository,
  ActivityView,
  ClubRepository,
  ConversationRepository,
  ConversationSummary,
  FollowRepository,
} from '../contracts';

export const userSummarySelect = { id: true, name: true, username: true } as const;

export const createFollowRepository = (prisma: PrismaClient): FollowRepository => ({
  follow: async (followerId, followingId) => {
    await prisma.follow.createMany({ data: [{ followerId, followingId }], skipDuplicates: true });
  },
  unfollow: async (followerId, followingId) => {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  },
  isFollowing: async (followerId, followingId) =>
    (await prisma.follow.count({ where: { followerId, followingId } })) > 0,
  listFollowers: async (userId) => {
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.follower);
  },
  listFollowing: async (userId) => {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.following);
  },
  followingIds: async (userId) => {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    return rows.map((row) => row.followingId);
  },
  followerIds: async (userId) => {
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });
    return rows.map((row) => row.followerId);
  },
});

export const createClubRepository = (prisma: PrismaClient): ClubRepository => ({
  create: (data) => prisma.bookClub.create({ data }),
  findById: (id) => prisma.bookClub.findUnique({ where: { id } }),
  findByInviteCode: (inviteCode) => prisma.bookClub.findUnique({ where: { inviteCode } }),
  update: (id, data) => prisma.bookClub.update({ where: { id }, data }),
  delete: async (id) => {
    await prisma.bookClub.deleteMany({ where: { id } });
  },
  listForUser: async (userId) => {
    const clubs = await prisma.bookClub.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return clubs.map(({ _count, ...club }) => ({ ...club, memberCount: _count.members }));
  },
  addMember: async (clubId, userId, role) => {
    await prisma.clubMember.createMany({ data: [{ clubId, userId, role }], skipDuplicates: true });
  },
  removeMember: async (clubId, userId) => {
    await prisma.clubMember.deleteMany({ where: { clubId, userId } });
  },
  findMember: (clubId, userId) =>
    prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } } }),
  listMembers: (clubId) =>
    prisma.clubMember.findMany({
      where: { clubId },
      include: { user: { select: userSummarySelect } },
      orderBy: { joinedAt: 'asc' },
    }),
});

const activityInclude = (viewerId: string) =>
  ({
    user: { select: userSummarySelect },
    userBook: { include: { book: true } },
    goal: true,
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: viewerId }, select: { userId: true } },
  }) satisfies Prisma.ActivityInclude;

type ActivityRow = Prisma.ActivityGetPayload<{ include: ReturnType<typeof activityInclude> }>;

const toActivityView = (row: ActivityRow): ActivityView => ({
  activity: {
    id: row.id,
    userId: row.userId,
    type: row.type,
    userBookId: row.userBookId,
    goalId: row.goalId,
    achievementCode: row.achievementCode,
    createdAt: row.createdAt,
  },
  user: row.user,
  userBook: row.userBook,
  goal: row.goal,
  likeCount: row._count.likes,
  commentCount: row._count.comments,
  likedByViewer: row.likes.length > 0,
});

export const createActivityRepository = (prisma: PrismaClient): ActivityRepository => ({
  create: (data) =>
    prisma.activity.create({
      data: {
        userId: data.userId,
        type: data.type,
        userBookId: data.userBookId ?? null,
        goalId: data.goalId ?? null,
        achievementCode: data.achievementCode ?? null,
      },
    }),
  findById: (id) => prisma.activity.findUnique({ where: { id } }),
  findByUserBookAndType: (userBookId, type) =>
    prisma.activity.findFirst({ where: { userBookId, type } }),
  bump: async (id, createdAt) => {
    await prisma.activity.update({ where: { id }, data: { createdAt } });
  },
  delete: async (id) => {
    await prisma.activity.deleteMany({ where: { id } });
  },
  listFeed: async ({ userIds, viewerId, before, limit }) => {
    const rows = await prisma.activity.findMany({
      where: { userId: { in: userIds }, ...(before ? { createdAt: { lt: before } } : {}) },
      include: activityInclude(viewerId),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
    return rows.map(toActivityView);
  },
  findView: async (id, viewerId) => {
    const row = await prisma.activity.findUnique({
      where: { id },
      include: activityInclude(viewerId),
    });
    return row ? toActivityView(row) : null;
  },
  like: async (activityId, userId) => {
    await prisma.activityLike.createMany({ data: [{ activityId, userId }], skipDuplicates: true });
  },
  unlike: async (activityId, userId) => {
    await prisma.activityLike.deleteMany({ where: { activityId, userId } });
  },
  listComments: (activityId) =>
    prisma.activityComment.findMany({
      where: { activityId },
      include: { user: { select: userSummarySelect } },
      orderBy: { createdAt: 'asc' },
    }),
  addComment: (activityId, userId, body) =>
    prisma.activityComment.create({
      data: { activityId, userId, body },
      include: { user: { select: userSummarySelect } },
    }),
  findComment: (id) => prisma.activityComment.findUnique({ where: { id } }),
  deleteComment: async (id) => {
    await prisma.activityComment.deleteMany({ where: { id } });
  },
});

export const createAchievementRepository = (prisma: PrismaClient): AchievementRepository => ({
  listForUser: (userId) =>
    prisma.userAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: 'asc' } }),
  unlock: async (userId, code, unlockedAt) => {
    const result = await prisma.userAchievement.createMany({
      data: [{ userId, code, unlockedAt }],
      skipDuplicates: true,
    });
    return result.count > 0;
  },
  listUnseen: (userId) =>
    prisma.userAchievement.findMany({
      where: { userId, seenAt: null },
      orderBy: { unlockedAt: 'asc' },
    }),
  markSeen: async (userId, codes, seenAt) => {
    await prisma.userAchievement.updateMany({
      where: { userId, code: { in: codes }, seenAt: null },
      data: { seenAt },
    });
  },
});

const conversationInclude = {
  participants: { include: { user: { select: userSummarySelect } } },
  club: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { sender: { select: userSummarySelect } },
  },
} satisfies Prisma.ConversationInclude;

type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;

export const createConversationRepository = (prisma: PrismaClient): ConversationRepository => {
  const countUnread = (conversationId: string, userId: string, lastReadAt: Date | null) =>
    prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });

  const toSummary = async (row: ConversationRow, userId: string): Promise<ConversationSummary> => {
    const own = row.participants.find((participant) => participant.userId === userId);
    const { participants, club, messages, ...conversation } = row;
    return {
      conversation,
      participants: participants.map((participant) => participant.user),
      club,
      lastMessage: messages[0] ?? null,
      unreadCount: await countUnread(row.id, userId, own?.lastReadAt ?? null),
    };
  };

  return {
    findById: (id) => prisma.conversation.findUnique({ where: { id } }),
    findByDirectKey: (directKey) => prisma.conversation.findUnique({ where: { directKey } }),
    findByClubId: (clubId) => prisma.conversation.findUnique({ where: { clubId } }),
    createDirect: (directKey, userIds) =>
      prisma.conversation.create({
        data: {
          type: 'DIRECT',
          directKey,
          participants: { create: userIds.map((userId) => ({ userId })) },
        },
      }),
    createForClub: (clubId, userIds) =>
      prisma.conversation.create({
        data: {
          type: 'CLUB',
          clubId,
          participants: { create: userIds.map((userId) => ({ userId })) },
        },
      }),
    addParticipant: async (conversationId, userId) => {
      await prisma.conversationParticipant.createMany({
        data: [{ conversationId, userId }],
        skipDuplicates: true,
      });
    },
    removeParticipant: async (conversationId, userId) => {
      await prisma.conversationParticipant.deleteMany({ where: { conversationId, userId } });
    },
    findParticipant: (conversationId, userId) =>
      prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      }),
    listForUser: async (userId) => {
      const rows = await prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        include: conversationInclude,
        orderBy: { updatedAt: 'desc' },
      });
      return Promise.all(rows.map((row) => toSummary(row, userId)));
    },
    findSummary: async (conversationId, userId) => {
      const row = await prisma.conversation.findFirst({
        where: { id: conversationId, participants: { some: { userId } } },
        include: conversationInclude,
      });
      return row ? toSummary(row, userId) : null;
    },
    listMessages: async (conversationId, { after, before, limit }) => {
      const include = { sender: { select: userSummarySelect } };
      if (after) {
        return prisma.message.findMany({
          where: { conversationId, createdAt: { gt: after } },
          include,
          orderBy: { createdAt: 'asc' },
          take: limit,
        });
      }
      const rows = await prisma.message.findMany({
        where: { conversationId, ...(before ? { createdAt: { lt: before } } : {}) },
        include,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return rows.reverse();
    },
    createMessage: async (conversationId, senderId, body) => {
      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: { conversationId, senderId, body },
          include: { sender: { select: userSummarySelect } },
        }),
        prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);
      return message;
    },
    markRead: async (conversationId, userId, readAt) => {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: readAt },
      });
    },
  };
};
