import type { ReadingSessionWithBook, UserBookWithBook } from '../domain/entities';
import type { ReadingSnapshot } from '../domain/readingMetrics';
import type { ReadingSessionRepository, UserBookRepository } from '../repositories/contracts';

export interface DetailedSnapshot extends ReadingSnapshot {
  sessions: ReadingSessionWithBook[];
  userBooks: UserBookWithBook[];
}

export class ReadingSnapshotService {
  constructor(
    private readonly sessions: ReadingSessionRepository,
    private readonly userBooks: UserBookRepository,
  ) {}

  async load(userId: string): Promise<DetailedSnapshot> {
    const [sessions, userBooks] = await Promise.all([
      this.sessions.list(userId, {}),
      this.userBooks.list(userId),
    ]);
    return { sessions, userBooks };
  }
}
