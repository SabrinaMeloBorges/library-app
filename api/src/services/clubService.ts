import { randomInt } from 'node:crypto';
import type { Book, BookClub, ClubMemberWithUser, ReadingGoal } from '../domain/entities';
import { AppError } from '../errors/AppError';
import type {
  BookRepository,
  ClubRepository,
  ClubWithMemberCount,
  ConversationRepository,
  ReadingGoalRepository,
  UserBookRepository,
} from '../repositories/contracts';
import type { CreateClubInput, UpdateClubInput } from '../validators/clubValidators';
import type { CreateGoalInput, UpdateGoalInput } from '../validators/goalValidators';
import type { ClubProgressService, CollectiveProgress } from './clubProgressService';
import type { EngagementHooks } from './engagementService';
import { buildGoalChanges, toGoalData } from './readingGoalService';
import type { SocialService } from './socialService';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 8;
const CLUB_NOT_FOUND = 'Clube não encontrado';
const ONLY_OWNER = 'Apenas quem criou o clube pode fazer isso';

export interface ClubGoalWithProgress extends ReadingGoal, CollectiveProgress {}

export interface ClubDetails {
  club: BookClub;
  viewerRole: 'OWNER' | 'MEMBER';
  members: ClubMemberWithUser[];
  currentBook: Book | null;
  goals: ClubGoalWithProgress[];
  conversationId: string | null;
}

const forbidden = (message: string) => new AppError(403, 'FORBIDDEN', message);

export class ClubService {
  constructor(
    private readonly clubs: ClubRepository,
    private readonly goals: ReadingGoalRepository,
    private readonly books: BookRepository,
    private readonly userBooks: UserBookRepository,
    private readonly conversations: ConversationRepository,
    private readonly social: SocialService,
    private readonly progress: ClubProgressService,
    private readonly engagement: EngagementHooks,
  ) {}

  list(userId: string): Promise<ClubWithMemberCount[]> {
    return this.clubs.listForUser(userId);
  }

  async create(userId: string, input: CreateClubInput): Promise<ClubDetails> {
    const currentBookId = await this.resolveCurrentBook(userId, input.currentUserBookId);
    const club = await this.clubs.create({
      name: input.name,
      description: input.description ?? null,
      currentBookId,
      ownerId: userId,
      inviteCode: await this.generateInviteCode(),
    });
    await this.clubs.addMember(club.id, userId, 'OWNER');
    await this.conversations.createForClub(club.id, [userId]);
    await this.engagement.usersChanged([userId]);
    return this.get(userId, club.id);
  }

  async get(userId: string, clubId: string): Promise<ClubDetails> {
    const club = await this.requireClub(clubId);
    const member = await this.clubs.findMember(clubId, userId);
    if (!member) throw AppError.notFound(CLUB_NOT_FOUND);

    const [members, goals, conversation, currentBook] = await Promise.all([
      this.clubs.listMembers(clubId),
      this.goals.listByClubIds([clubId]),
      this.conversations.findByClubId(clubId),
      club.currentBookId ? this.books.findById(club.currentBookId) : Promise.resolve(null),
    ]);
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => ({ ...goal, ...(await this.progress.calculate(goal)) })),
    );
    return {
      club,
      viewerRole: member.role,
      members,
      currentBook,
      goals: goalsWithProgress,
      conversationId: conversation?.id ?? null,
    };
  }

  async update(userId: string, clubId: string, input: UpdateClubInput): Promise<ClubDetails> {
    await this.requireOwner(userId, clubId);
    const currentBookId =
      input.currentUserBookId === undefined
        ? undefined
        : await this.resolveCurrentBook(userId, input.currentUserBookId);
    await this.clubs.update(clubId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(currentBookId !== undefined ? { currentBookId } : {}),
    });
    return this.get(userId, clubId);
  }

  async remove(userId: string, clubId: string): Promise<void> {
    await this.requireOwner(userId, clubId);
    await this.clubs.delete(clubId);
  }

  async join(userId: string, inviteCode: string): Promise<ClubDetails> {
    const club = await this.clubs.findByInviteCode(inviteCode);
    if (!club) throw AppError.notFound('Nenhum clube encontrado com este código');
    await this.addToClub(club.id, userId);
    return this.get(userId, club.id);
  }

  async addMember(userId: string, clubId: string, memberId: string): Promise<ClubDetails> {
    await this.requireOwner(userId, clubId);
    if (await this.clubs.findMember(clubId, memberId)) {
      throw AppError.conflict('Esta pessoa já faz parte do clube');
    }
    if (!(await this.social.areFriends(userId, memberId))) {
      throw forbidden('Só é possível adicionar amigos: vocês precisam se seguir');
    }
    await this.addToClub(clubId, memberId);
    return this.get(userId, clubId);
  }

  async removeMember(userId: string, clubId: string, memberId: string): Promise<void> {
    const club = await this.requireClub(clubId);
    const isLeaving = userId === memberId;
    if (isLeaving && club.ownerId === userId) {
      throw AppError.validation('Quem criou o clube não pode sair; exclua o clube se desejar');
    }
    if (!isLeaving && club.ownerId !== userId) throw forbidden(ONLY_OWNER);
    if (!(await this.clubs.findMember(clubId, memberId))) {
      throw AppError.notFound('Esta pessoa não faz parte do clube');
    }
    await this.clubs.removeMember(clubId, memberId);
    const conversation = await this.conversations.findByClubId(clubId);
    if (conversation) await this.conversations.removeParticipant(conversation.id, memberId);
  }

  async createGoal(userId: string, clubId: string, input: CreateGoalInput): Promise<ClubDetails> {
    await this.requireOwner(userId, clubId);
    await this.goals.create(userId, toGoalData(input), clubId);
    await this.engagement.readingChanged(userId);
    return this.get(userId, clubId);
  }

  async updateGoal(
    userId: string,
    clubId: string,
    goalId: string,
    input: UpdateGoalInput,
  ): Promise<ClubDetails> {
    await this.requireOwner(userId, clubId);
    const goal = await this.requireGoal(clubId, goalId);
    await this.goals.updateById(goal.id, buildGoalChanges(goal, input));
    await this.engagement.readingChanged(userId);
    return this.get(userId, clubId);
  }

  async removeGoal(userId: string, clubId: string, goalId: string): Promise<void> {
    await this.requireOwner(userId, clubId);
    await this.requireGoal(clubId, goalId);
    await this.goals.deleteById(goalId);
  }

  private async addToClub(clubId: string, memberId: string): Promise<void> {
    await this.clubs.addMember(clubId, memberId, 'MEMBER');
    const conversation = await this.conversations.findByClubId(clubId);
    if (conversation) await this.conversations.addParticipant(conversation.id, memberId);
    await this.engagement.usersChanged([memberId]);
  }

  private async resolveCurrentBook(
    userId: string,
    userBookId: string | null | undefined,
  ): Promise<string | null> {
    if (!userBookId) return null;
    const userBook = await this.userBooks.findById(userId, userBookId);
    if (!userBook) throw AppError.notFound('Livro não encontrado na sua biblioteca');
    return userBook.bookId;
  }

  private async requireClub(clubId: string): Promise<BookClub> {
    const club = await this.clubs.findById(clubId);
    if (!club) throw AppError.notFound(CLUB_NOT_FOUND);
    return club;
  }

  private async requireOwner(userId: string, clubId: string): Promise<BookClub> {
    const club = await this.requireClub(clubId);
    if (!(await this.clubs.findMember(clubId, userId))) throw AppError.notFound(CLUB_NOT_FOUND);
    if (club.ownerId !== userId) throw forbidden(ONLY_OWNER);
    return club;
  }

  private async requireGoal(clubId: string, goalId: string): Promise<ReadingGoal> {
    const goal = await this.goals.findClubGoal(clubId, goalId);
    if (!goal) throw AppError.notFound('Meta do clube não encontrada');
    return goal;
  }

  private async generateInviteCode(): Promise<string> {
    for (;;) {
      const code = Array.from(
        { length: INVITE_LENGTH },
        () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)],
      ).join('');
      if (!(await this.clubs.findByInviteCode(code))) return code;
    }
  }
}
