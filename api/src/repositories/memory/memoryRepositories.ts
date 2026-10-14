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

interface MemoryStore {
  users: Map<string, User>;
  authSessions: Map<string, AuthSession>;
  books: Map<string, Book>;
  userBooks: Map<string, UserBook>;
  readingSessions: Map<string, ReadingSession>;
  readingGoals: Map<string, ReadingGoal>;
}

const createStore = (): MemoryStore => ({
  users: new Map(),
  authSessions: new Map(),
  books: new Map(),
  userBooks: new Map(),
  readingSessions: new Map(),
  readingGoals: new Map(),
});

const requireOwned = <T extends { userId: string }>(
  map: Map<string, T>,
  userId: string,
  id: string,
): T => {
  const item = map.get(id);
  if (!item || item.userId !== userId) throw new Error('Registro não encontrado para o usuário');
  return item;
};

const createUserRepository = (store: MemoryStore): UserRepository => ({
  findById: async (id) => store.users.get(id) ?? null,
  findByEmail: async (email) =>
    [...store.users.values()].find((user) => user.email === email) ?? null,
  create: async (data) => {
    const user: User = { id: randomUUID(), createdAt: new Date(), ...data };
    store.users.set(user.id, user);
    return user;
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
      for (const [sessionId, session] of store.readingSessions) {
        if (session.userBookId === id) store.readingSessions.delete(sessionId);
      }
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

const createReadingGoalRepository = (store: MemoryStore): ReadingGoalRepository => ({
  list: async (userId) =>
    [...store.readingGoals.values()]
      .filter((goal) => goal.userId === userId)
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime()),
  findById: async (userId, id) => {
    const goal = store.readingGoals.get(id);
    return goal && goal.userId === userId ? goal : null;
  },
  create: async (userId, data) => {
    const goal: ReadingGoal = { id: randomUUID(), userId, createdAt: new Date(), ...data };
    store.readingGoals.set(goal.id, goal);
    return goal;
  },
  update: async (userId, id, data) => {
    const current = requireOwned(store.readingGoals, userId, id);
    const updated = { ...current, ...data };
    store.readingGoals.set(id, updated);
    return updated;
  },
  delete: async (userId, id) => {
    const goal = store.readingGoals.get(id);
    if (goal && goal.userId === userId) store.readingGoals.delete(id);
  },
});

export const createMemoryRepositories = (): Repositories => {
  const store = createStore();
  return {
    users: createUserRepository(store),
    authSessions: createAuthSessionRepository(store),
    books: createBookRepository(store),
    userBooks: createUserBookRepository(store),
    readingSessions: createReadingSessionRepository(store),
    readingGoals: createReadingGoalRepository(store),
  };
};
