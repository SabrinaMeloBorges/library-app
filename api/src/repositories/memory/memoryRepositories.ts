import { randomUUID } from 'node:crypto';
import type {
  AuthSession,
  Book,
  ReadingGoal,
  ReadingSession,
  User,
  UserBook,
  UserBookWithBook,
} from '../../domain/entities';
import type {
  AuthSessionRepository,
  BookRepository,
  LibraryFilters,
  ReadingGoalRepository,
  ReadingSessionRepository,
  Repositories,
  UserBookRepository,
  UserRepository,
} from '../contracts';
import { createMemorySocialRepositories } from './socialRepositories';
import { createStore, deleteWhere, requireOwned, toUserSummary, type MemoryStore } from './store';

const createUserRepository = (store: MemoryStore): UserRepository => ({
  findById: async (id) => store.users.get(id) ?? null,
  findByEmail: async (email) =>
    [...store.users.values()].find((user) => user.email === email) ?? null,
  findByGoogleId: async (googleId) =>
    [...store.users.values()].find((user) => user.googleId === googleId) ?? null,
  findByUsername: async (username) =>
    [...store.users.values()].find((user) => user.username === username) ?? null,
  create: async (data) => {
    const user: User = {
      id: randomUUID(),
      createdAt: new Date(),
      bio: null,
      shareActivity: true,
      ...data,
      googleId: data.googleId ?? null,
    };
    store.users.set(user.id, user);
    return user;
  },
  update: async (id, data) => {
    const current = store.users.get(id);
    if (!current) throw new Error('Usuário não encontrado');
    const updated = { ...current, ...data };
    store.users.set(id, updated);
    return updated;
  },
  search: async (query, excludeUserId, limit) => {
    const term = query.toLowerCase();
    return [...store.users.values()]
      .filter((user) => user.id !== excludeUserId)
      .filter((user) => `${user.name} ${user.username}`.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((user) => toUserSummary(store, user.id));
  },
});

const createAuthSessionRepository = (store: MemoryStore): AuthSessionRepository => ({
  create: async (data) => {
    const session: AuthSession = { ...data, revokedAt: null };
    store.authSessions.set(session.id, session);
    return session;
  },
  findById: async (id) => store.authSessions.get(id) ?? null,
  revoke: async (id) => {
    const session = store.authSessions.get(id);
    if (session && !session.revokedAt) session.revokedAt = new Date();
  },
});

const createBookRepository = (store: MemoryStore): BookRepository => ({
  findById: async (id) => store.books.get(id) ?? null,
  findByExternalId: async (source, externalId) =>
    [...store.books.values()].find(
      (book) => book.externalSource === source && book.externalId === externalId,
    ) ?? null,
  create: async (data) => {
    const book: Book = { id: randomUUID(), ...data };
    store.books.set(book.id, book);
    return book;
  },
  update: async (id, data) => {
    const book = store.books.get(id);
    if (!book) throw new Error('Livro não encontrado');
    const updated = { ...book, ...data };
    store.books.set(id, updated);
    return updated;
  },
});

const matchesFilters = (item: UserBookWithBook, filters: LibraryFilters): boolean => {
  if (filters.status && item.status !== filters.status) return false;
  if (filters.favoritesOnly && !item.isFavorite) return false;
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const haystack = `${item.book.title} ${item.book.authors}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
};

const createUserBookRepository = (store: MemoryStore): UserBookRepository => {
  const withBook = (userBook: UserBook): UserBookWithBook => {
    const book = store.books.get(userBook.bookId);
    if (!book) throw new Error('Livro do catálogo ausente');
    return { ...userBook, book };
  };

  return {
    list: async (userId, filters = {}) =>
      [...store.userBooks.values()]
        .filter((item) => item.userId === userId)
        .map(withBook)
        .filter((item) => matchesFilters(item, filters))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    findById: async (userId, id) => {
      const item = store.userBooks.get(id);
      return item && item.userId === userId ? withBook(item) : null;
    },
    findByBook: async (userId, bookId) =>
      [...store.userBooks.values()].find(
        (item) => item.userId === userId && item.bookId === bookId,
      ) ?? null,
    create: async (userId, bookId, data) => {
      const now = new Date();
      const userBook: UserBook = {
        id: randomUUID(),
        userId,
        bookId,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      store.userBooks.set(userBook.id, userBook);
      return withBook(userBook);
    },
    update: async (userId, id, data) => {
      const current = requireOwned(store.userBooks, userId, id);
      const updated: UserBook = { ...current, ...data, updatedAt: new Date() };
      store.userBooks.set(id, updated);
      return withBook(updated);
    },
    delete: async (userId, id) => {
      const item = store.userBooks.get(id);
      if (!item || item.userId !== userId) return;
      store.userBooks.delete(id);
      deleteWhere(store.readingSessions, (session) => session.userBookId === id);
      deleteWhere(store.activities, (activity) => activity.userBookId === id);
    },
  };
};

const createReadingSessionRepository = (store: MemoryStore): ReadingSessionRepository => ({
  list: async (userId, filters) => {
    const sessions = [...store.readingSessions.values()]
      .filter((session) => session.userId === userId)
      .filter((session) => !filters.userBookId || session.userBookId === filters.userBookId)
      .filter((session) => !filters.from || session.readAt >= filters.from)
      .filter((session) => !filters.to || session.readAt <= filters.to)
      .sort((a, b) => b.readAt.getTime() - a.readAt.getTime())
      .slice(0, filters.limit ?? Number.MAX_SAFE_INTEGER);
    return sessions.map((session) => {
      const userBook = store.userBooks.get(session.userBookId);
      const book = userBook ? store.books.get(userBook.bookId) : undefined;
      return { ...session, bookTitle: book?.title ?? '' };
    });
  },
  findById: async (userId, id) => {
    const session = store.readingSessions.get(id);
    return session && session.userId === userId ? session : null;
  },
  create: async (userId, data) => {
    const session: ReadingSession = { id: randomUUID(), userId, createdAt: new Date(), ...data };
    store.readingSessions.set(session.id, session);
    return session;
  },
  update: async (userId, id, data) => {
    const current = requireOwned(store.readingSessions, userId, id);
    const updated = { ...current, ...data };
    store.readingSessions.set(id, updated);
    return updated;
  },
  delete: async (userId, id) => {
    const session = store.readingSessions.get(id);
    if (session && session.userId === userId) store.readingSessions.delete(id);
  },
  maxEndPage: async (userId, userBookId) => {
    const endPages = [...store.readingSessions.values()]
      .filter((session) => session.userId === userId && session.userBookId === userBookId)
      .map((session) => session.endPage);
    return endPages.length > 0 ? Math.max(...endPages) : null;
  },
});

const byEndDate = (a: ReadingGoal, b: ReadingGoal): number =>
  a.endDate.getTime() - b.endDate.getTime();

const createReadingGoalRepository = (store: MemoryStore): ReadingGoalRepository => {
  const isPersonalGoalOf = (goal: ReadingGoal | undefined, userId: string): goal is ReadingGoal =>
    goal !== undefined && goal.userId === userId && goal.clubId === null;

  const removeGoal = (id: string): void => {
    store.readingGoals.delete(id);
    deleteWhere(store.activities, (activity) => activity.goalId === id);
  };

  const replace = (id: string, data: Partial<ReadingGoal>): ReadingGoal => {
    const current = store.readingGoals.get(id);
    if (!current) throw new Error('Meta não encontrada');
    const updated = { ...current, ...data };
    store.readingGoals.set(id, updated);
    return updated;
  };

  return {
    list: async (userId) =>
      [...store.readingGoals.values()]
        .filter((goal) => isPersonalGoalOf(goal, userId))
        .sort(byEndDate),
    findById: async (userId, id) => {
      const goal = store.readingGoals.get(id);
      return isPersonalGoalOf(goal, userId) ? goal : null;
    },
    create: async (userId, data, clubId) => {
      const goal: ReadingGoal = {
        id: randomUUID(),
        userId,
        clubId: clubId ?? null,
        completedAt: null,
        createdAt: new Date(),
        ...data,
      };
      store.readingGoals.set(goal.id, goal);
      return goal;
    },
    update: async (userId, id, data) => {
      if (!isPersonalGoalOf(store.readingGoals.get(id), userId)) {
        throw new Error('Meta não encontrada para o usuário');
      }
      return replace(id, data);
    },
    delete: async (userId, id) => {
      if (isPersonalGoalOf(store.readingGoals.get(id), userId)) removeGoal(id);
    },
    listByClubIds: async (clubIds) =>
      [...store.readingGoals.values()]
        .filter((goal) => goal.clubId !== null && clubIds.includes(goal.clubId))
        .sort(byEndDate),
    findClubGoal: async (clubId, id) => {
      const goal = store.readingGoals.get(id);
      return goal && goal.clubId === clubId ? goal : null;
    },
    updateById: async (id, data) => replace(id, data),
    deleteById: async (id) => removeGoal(id),
    markCompleted: async (id, completedAt) => {
      const goal = store.readingGoals.get(id);
      if (goal && !goal.completedAt) replace(id, { completedAt });
    },
  };
};

export const createMemoryRepositories = (): Repositories => {
  const store = createStore();
  return {
    users: createUserRepository(store),
    authSessions: createAuthSessionRepository(store),
    books: createBookRepository(store),
    userBooks: createUserBookRepository(store),
    readingSessions: createReadingSessionRepository(store),
    readingGoals: createReadingGoalRepository(store),
    ...createMemorySocialRepositories(store),
  };
};
