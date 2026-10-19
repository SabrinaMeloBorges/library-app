import type { PrismaClient, Prisma } from '@prisma/client';
import type { ReadingSessionWithBook, UserBookWithBook } from '../../domain/entities';
import type {
  AuthSessionRepository,
  BookRepository,
  LibraryFilters,
  ReadingGoalRepository,
  ReadingSessionFilters,
  ReadingSessionRepository,
  Repositories,
  UserBookRepository,
  UserRepository,
} from '../contracts';
import {
  createAchievementRepository,
  createActivityRepository,
  createClubRepository,
  createConversationRepository,
  createFollowRepository,
  userSummarySelect,
} from './socialRepositories';

const createUserRepository = (prisma: PrismaClient): UserRepository => ({
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findByUsername: (username) => prisma.user.findUnique({ where: { username } }),
  create: (data) => prisma.user.create({ data }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  search: (query, excludeUserId, limit) =>
    prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [{ name: { contains: query } }, { username: { contains: query } }],
      },
      select: userSummarySelect,
      orderBy: { name: 'asc' },
      take: limit,
    }),
});

const createAuthSessionRepository = (prisma: PrismaClient): AuthSessionRepository => ({
  create: (data) => prisma.authSession.create({ data }),
  findById: (id) => prisma.authSession.findUnique({ where: { id } }),
  revoke: async (id) => {
    await prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
});

const createBookRepository = (prisma: PrismaClient): BookRepository => ({
  findById: (id) => prisma.book.findUnique({ where: { id } }),
  findByExternalId: (externalSource, externalId) =>
    prisma.book.findUnique({
      where: { externalSource_externalId: { externalSource, externalId } },
    }),
  create: (data) => prisma.book.create({ data }),
  update: (id, data) => prisma.book.update({ where: { id }, data }),
});

const buildLibraryWhere = (
  userId: string,
  filters: LibraryFilters = {},
): Prisma.UserBookWhereInput => ({
  userId,
  ...(filters.status ? { status: filters.status } : {}),
  ...(filters.favoritesOnly ? { isFavorite: true } : {}),
  ...(filters.query
    ? {
        book: {
          OR: [{ title: { contains: filters.query } }, { authors: { contains: filters.query } }],
        },
      }
    : {}),
});

const createUserBookRepository = (prisma: PrismaClient): UserBookRepository => {
  const findOwned = async (userId: string, id: string): Promise<UserBookWithBook> => {
    const userBook = await prisma.userBook.findFirst({
      where: { id, userId },
      include: { book: true },
    });
    if (!userBook) throw new Error('UserBook não encontrado para o usuário');
    return userBook;
  };

  return {
    list: (userId, filters) =>
      prisma.userBook.findMany({
        where: buildLibraryWhere(userId, filters),
        include: { book: true },
        orderBy: { updatedAt: 'desc' },
      }),
    findById: (userId, id) =>
      prisma.userBook.findFirst({ where: { id, userId }, include: { book: true } }),
    findByBook: (userId, bookId) =>
      prisma.userBook.findUnique({ where: { userId_bookId: { userId, bookId } } }),
    create: (userId, bookId, data) =>
      prisma.userBook.create({ data: { ...data, userId, bookId }, include: { book: true } }),
    update: async (userId, id, data) => {
      await findOwned(userId, id);
      return prisma.userBook.update({ where: { id }, data, include: { book: true } });
    },
    delete: async (userId, id) => {
      await prisma.userBook.deleteMany({ where: { id, userId } });
    },
  };
};

const buildSessionWhere = (
  userId: string,
  filters: ReadingSessionFilters,
): Prisma.ReadingSessionWhereInput => ({
  userId,
  ...(filters.userBookId ? { userBookId: filters.userBookId } : {}),
  ...(filters.from || filters.to
    ? {
        readAt: {
          ...(filters.from ? { gte: filters.from } : {}),
          ...(filters.to ? { lte: filters.to } : {}),
        },
      }
    : {}),
});

const createReadingSessionRepository = (prisma: PrismaClient): ReadingSessionRepository => {
  const assertOwned = async (userId: string, id: string): Promise<void> => {
    const count = await prisma.readingSession.count({ where: { id, userId } });
    if (count === 0) throw new Error('Sessão não encontrada para o usuário');
  };

  return {
    list: async (userId, filters) => {
      const sessions = await prisma.readingSession.findMany({
        where: buildSessionWhere(userId, filters),
        include: { userBook: { include: { book: { select: { title: true } } } } },
        orderBy: { readAt: 'desc' },
        ...(filters.limit ? { take: filters.limit } : {}),
      });
      return sessions.map(({ userBook, ...session }): ReadingSessionWithBook => ({
        ...session,
        bookTitle: userBook.book.title,
      }));
    },
    findById: (userId, id) => prisma.readingSession.findFirst({ where: { id, userId } }),
    create: (userId, data) => prisma.readingSession.create({ data: { ...data, userId } }),
    update: async (userId, id, data) => {
      await assertOwned(userId, id);
      return prisma.readingSession.update({ where: { id }, data });
    },
    delete: async (userId, id) => {
      await prisma.readingSession.deleteMany({ where: { id, userId } });
    },
    maxEndPage: async (userId, userBookId) => {
      const result = await prisma.readingSession.aggregate({
        where: { userId, userBookId },
        _max: { endPage: true },
      });
      return result._max.endPage;
    },
  };
};

const createReadingGoalRepository = (prisma: PrismaClient): ReadingGoalRepository => {
  const assertOwned = async (userId: string, id: string): Promise<void> => {
    const count = await prisma.readingGoal.count({ where: { id, userId, clubId: null } });
    if (count === 0) throw new Error('Meta não encontrada para o usuário');
  };

  return {
    list: (userId) =>
      prisma.readingGoal.findMany({
        where: { userId, clubId: null },
        orderBy: [{ endDate: 'asc' }],
      }),
    findById: (userId, id) => prisma.readingGoal.findFirst({ where: { id, userId, clubId: null } }),
    create: (userId, data, clubId) =>
      prisma.readingGoal.create({ data: { ...data, userId, clubId: clubId ?? null } }),
    update: async (userId, id, data) => {
      await assertOwned(userId, id);
      return prisma.readingGoal.update({ where: { id }, data });
    },
    delete: async (userId, id) => {
      await prisma.readingGoal.deleteMany({ where: { id, userId, clubId: null } });
    },
    listByClubIds: (clubIds) =>
      clubIds.length === 0
        ? Promise.resolve([])
        : prisma.readingGoal.findMany({
            where: { clubId: { in: clubIds } },
            orderBy: [{ endDate: 'asc' }],
          }),
    findClubGoal: (clubId, id) => prisma.readingGoal.findFirst({ where: { id, clubId } }),
    updateById: (id, data) => prisma.readingGoal.update({ where: { id }, data }),
    deleteById: async (id) => {
      await prisma.readingGoal.deleteMany({ where: { id } });
    },
    markCompleted: async (id, completedAt) => {
      await prisma.readingGoal.updateMany({
        where: { id, completedAt: null },
        data: { completedAt },
      });
    },
  };
};

export const createPrismaRepositories = (prisma: PrismaClient): Repositories => ({
  users: createUserRepository(prisma),
  authSessions: createAuthSessionRepository(prisma),
  books: createBookRepository(prisma),
  userBooks: createUserBookRepository(prisma),
  readingSessions: createReadingSessionRepository(prisma),
  readingGoals: createReadingGoalRepository(prisma),
  follows: createFollowRepository(prisma),
  clubs: createClubRepository(prisma),
  activities: createActivityRepository(prisma),
  achievements: createAchievementRepository(prisma),
  conversations: createConversationRepository(prisma),
});
