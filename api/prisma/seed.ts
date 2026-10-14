import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DEMO_EMAIL = 'demo@library.local';
const DAY_MS = 24 * 60 * 60 * 1000;

const prisma = new PrismaClient();

const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

const seed = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstração não pode ser executado em produção.');
  }
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error(
      'Defina SEED_DEMO_PASSWORD (mínimo de 8 caracteres) para criar o usuário demo.',
    );
  }

  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });
  const user = await prisma.user.create({
    data: {
      name: 'Leitora Demo',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const createBook = (title: string, authors: string, pageCount: number) =>
    prisma.book.create({ data: { title, authors, pageCount, createdByUserId: user.id } });

  const [secretHistory, rebecca, siddhartha] = await Promise.all([
    createBook('A História Secreta', 'Donna Tartt', 576),
    createBook('Rebecca', 'Daphne du Maurier', 448),
    createBook('Sidarta', 'Hermann Hesse', 168),
  ]);

  const reading = await prisma.userBook.create({
    data: {
      userId: user.id,
      bookId: secretHistory.id,
      status: 'READING',
      totalPages: 576,
      currentPage: 120,
      isFavorite: true,
      startedAt: daysAgo(6),
    },
  });
  await prisma.userBook.create({
    data: { userId: user.id, bookId: rebecca.id, status: 'WANT_TO_READ', totalPages: 448 },
  });
  await prisma.userBook.create({
    data: {
      userId: user.id,
      bookId: siddhartha.id,
      status: 'FINISHED',
      totalPages: 168,
      currentPage: 168,
      rating: 5,
      startedAt: daysAgo(20),
      finishedAt: daysAgo(12),
    },
  });

  await prisma.readingSession.createMany({
    data: [
      {
        userId: user.id,
        userBookId: reading.id,
        startPage: 0,
        endPage: 45,
        durationMinutes: 50,
        readAt: daysAgo(6),
      },
      {
        userId: user.id,
        userBookId: reading.id,
        startPage: 45,
        endPage: 80,
        durationMinutes: 40,
        readAt: daysAgo(3),
      },
      {
        userId: user.id,
        userBookId: reading.id,
        startPage: 80,
        endPage: 120,
        durationMinutes: 45,
        readAt: daysAgo(1),
      },
    ],
  });

  const year = new Date().getFullYear();
  await prisma.readingGoal.create({
    data: {
      userId: user.id,
      title: `Ler 12 livros em ${year}`,
      type: 'BOOKS_FINISHED',
      period: 'YEARLY',
      targetValue: 12,
      startDate: new Date(`${year}-01-01T00:00:00.000Z`),
      endDate: new Date(`${year}-12-31T00:00:00.000Z`),
    },
  });

  console.info(`Usuário de demonstração criado: ${DEMO_EMAIL}`);
};

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
