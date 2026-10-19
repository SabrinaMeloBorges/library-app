import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_USERS = [
  { name: 'Leitora Demo', username: 'leitora_demo', email: 'demo@library.local' },
  { name: 'Bruno Lima', username: 'bruno.lima', email: 'bruno@library.local' },
  { name: 'Clara Souza', username: 'clara.souza', email: 'clara@library.local' },
] as const;

const prisma = new PrismaClient();

const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

const requirePassword = (): string => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstração não pode ser executado em produção.');
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'Defina SEED_DEMO_PASSWORD (mínimo de 8 caracteres) para criar os usuários demo.',
    );
  }
  return password;
};

const createUsers = async (passwordHash: string) => {
  await prisma.user.deleteMany({ where: { email: { in: DEMO_USERS.map((user) => user.email) } } });
  return Promise.all(
    DEMO_USERS.map((user) => prisma.user.create({ data: { ...user, passwordHash } })),
  );
};

const seed = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(requirePassword(), 12);
  const [demo, bruno, clara] = await createUsers(passwordHash);

  const createBook = (title: string, authors: string, pageCount: number, subjects: string) =>
    prisma.book.create({ data: { title, authors, pageCount, subjects, createdByUserId: demo.id } });

  const [secretHistory, rebecca, siddhartha] = await Promise.all([
    createBook('A História Secreta', 'Donna Tartt', 576, 'Ficção, Suspense'),
    createBook('Rebecca', 'Daphne du Maurier', 448, 'Romance gótico'),
    createBook('Sidarta', 'Hermann Hesse', 168, 'Clássico, Filosofia'),
  ]);

  const reading = await prisma.userBook.create({
    data: {
      userId: demo.id,
      bookId: secretHistory.id,
      status: 'READING',
      totalPages: 576,
      currentPage: 120,
      isFavorite: true,
      startedAt: daysAgo(6),
    },
  });
  await prisma.userBook.create({
    data: { userId: demo.id, bookId: rebecca.id, status: 'WANT_TO_READ', totalPages: 448 },
  });
  const finished = await prisma.userBook.create({
    data: {
      userId: demo.id,
      bookId: siddhartha.id,
      status: 'FINISHED',
      totalPages: 168,
      currentPage: 168,
      rating: 5,
      review: 'Uma travessia serena sobre buscar o próprio caminho. Releria com prazer.',
      startedAt: daysAgo(20),
      finishedAt: daysAgo(12),
    },
  });
  const brunoReading = await prisma.userBook.create({
    data: {
      userId: bruno.id,
      bookId: secretHistory.id,
      status: 'READING',
      totalPages: 576,
      currentPage: 210,
      startedAt: daysAgo(9),
    },
  });
  const claraFinished = await prisma.userBook.create({
    data: {
      userId: clara.id,
      bookId: rebecca.id,
      status: 'FINISHED',
      totalPages: 448,
      currentPage: 448,
      rating: 4,
      review: 'Manderley é personagem por si só. Atmosfera impecável.',
      startedAt: daysAgo(15),
      finishedAt: daysAgo(2),
    },
  });

  await prisma.readingSession.createMany({
    data: [
      {
        userId: demo.id,
        userBookId: finished.id,
        startPage: 0,
        endPage: 168,
        durationMinutes: 240,
        readAt: daysAgo(13),
      },
      {
        userId: demo.id,
        userBookId: reading.id,
        startPage: 0,
        endPage: 45,
        durationMinutes: 50,
        readAt: daysAgo(6),
      },
      {
        userId: demo.id,
        userBookId: reading.id,
        startPage: 45,
        endPage: 80,
        durationMinutes: 40,
        readAt: daysAgo(3),
      },
      {
        userId: demo.id,
        userBookId: reading.id,
        startPage: 80,
        endPage: 120,
        durationMinutes: 45,
        readAt: daysAgo(1),
      },
      {
        userId: bruno.id,
        userBookId: brunoReading.id,
        startPage: 0,
        endPage: 210,
        durationMinutes: 300,
        readAt: daysAgo(2),
      },
    ],
  });

  const year = new Date().getFullYear();
  const yearRange = {
    startDate: new Date(`${year}-01-01T00:00:00.000Z`),
    endDate: new Date(`${year}-12-31T00:00:00.000Z`),
  };
  await prisma.readingGoal.create({
    data: {
      userId: demo.id,
      title: `Ler 12 livros em ${year}`,
      type: 'BOOKS_FINISHED',
      period: 'YEARLY',
      targetValue: 12,
      ...yearRange,
    },
  });

  await prisma.follow.createMany({
    data: [
      { followerId: demo.id, followingId: bruno.id },
      { followerId: bruno.id, followingId: demo.id },
      { followerId: demo.id, followingId: clara.id },
      { followerId: clara.id, followingId: demo.id },
      { followerId: bruno.id, followingId: clara.id },
    ],
  });

  const club = await prisma.bookClub.create({
    data: {
      name: 'Clube Dark Academia',
      description: 'Leituras sombrias, cafés e discussões às sextas.',
      inviteCode: 'DARKACAD',
      ownerId: demo.id,
      currentBookId: secretHistory.id,
      members: {
        create: [
          { userId: demo.id, role: 'OWNER' },
          { userId: bruno.id, role: 'MEMBER' },
          { userId: clara.id, role: 'MEMBER' },
        ],
      },
    },
  });
  await prisma.readingGoal.create({
    data: {
      userId: demo.id,
      clubId: club.id,
      title: 'Juntos: 1.500 páginas este ano',
      type: 'PAGES_READ',
      period: 'YEARLY',
      targetValue: 1500,
      ...yearRange,
    },
  });

  await prisma.conversation.create({
    data: {
      type: 'CLUB',
      clubId: club.id,
      participants: { create: [demo, bruno, clara].map((user) => ({ userId: user.id })) },
      messages: {
        create: [
          {
            senderId: bruno.id,
            body: 'Quem já chegou na parte do bacanal?',
            createdAt: daysAgo(1),
          },
          {
            senderId: clara.id,
            body: 'Ainda não! Sem spoilers, por favor.',
            createdAt: daysAgo(0.9),
          },
        ],
      },
    },
  });

  await prisma.userAchievement.createMany({
    data: [
      'FIRST_LOGIN',
      'FIRST_BOOK',
      'FIRST_SESSION',
      'PAGES_100',
      'FIRST_REVIEW',
      'FIRST_BOOK_FINISHED',
      'FIRST_FRIEND',
      'FIRST_CLUB',
    ].map((code, index) => ({
      userId: demo.id,
      code,
      unlockedAt: daysAgo(20 - index),
      seenAt: daysAgo(1),
    })),
  });

  const brunoStarted = await prisma.activity.create({
    data: {
      userId: bruno.id,
      type: 'BOOK_STARTED',
      userBookId: brunoReading.id,
      createdAt: daysAgo(9),
    },
  });
  const claraReview = await prisma.activity.create({
    data: {
      userId: clara.id,
      type: 'REVIEW_POSTED',
      userBookId: claraFinished.id,
      createdAt: daysAgo(2),
    },
  });
  await prisma.activity.createMany({
    data: [
      {
        userId: clara.id,
        type: 'BOOK_FINISHED',
        userBookId: claraFinished.id,
        createdAt: daysAgo(2.1),
      },
      { userId: demo.id, type: 'REVIEW_POSTED', userBookId: finished.id, createdAt: daysAgo(12) },
      {
        userId: demo.id,
        type: 'ACHIEVEMENT_UNLOCKED',
        achievementCode: 'FIRST_BOOK_FINISHED',
        createdAt: daysAgo(12),
      },
      {
        userId: bruno.id,
        type: 'ACHIEVEMENT_UNLOCKED',
        achievementCode: 'PAGES_100',
        createdAt: daysAgo(2),
      },
    ],
  });
  await prisma.activityLike.createMany({
    data: [
      { activityId: claraReview.id, userId: demo.id },
      { activityId: claraReview.id, userId: bruno.id },
      { activityId: brunoStarted.id, userId: demo.id },
    ],
  });
  await prisma.activityComment.create({
    data: { activityId: claraReview.id, userId: bruno.id, body: 'Preciso ler logo!' },
  });

  console.info(
    'Usuários de demonstração criados: demo@library.local, bruno@library.local, clara@library.local',
  );
};

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
