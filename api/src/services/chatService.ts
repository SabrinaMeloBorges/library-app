import { AppError } from '../errors/AppError';
import type {
  ConversationRepository,
  ConversationSummary,
  MessageWithSender,
  UserRepository,
} from '../repositories/contracts';
import type { MessagesQuery } from '../validators/chatValidators';
import type { SocialService } from './socialService';

const CONVERSATION_NOT_FOUND = 'Conversa não encontrada';

const directKeyFor = (firstId: string, secondId: string): string =>
  [firstId, secondId].sort().join(':');

export class ChatService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly users: UserRepository,
    private readonly social: SocialService,
  ) {}

  list(userId: string): Promise<ConversationSummary[]> {
    return this.conversations.listForUser(userId);
  }

  async get(userId: string, conversationId: string): Promise<ConversationSummary> {
    const summary = await this.conversations.findSummary(conversationId, userId);
    if (!summary) throw AppError.notFound(CONVERSATION_NOT_FOUND);
    return summary;
  }

  async openDirect(userId: string, otherUserId: string): Promise<ConversationSummary> {
    if (userId === otherUserId) throw AppError.validation('Escolha outra pessoa para conversar');
    if (!(await this.users.findById(otherUserId)))
      throw AppError.notFound('Usuário não encontrado');
    if (!(await this.social.areFriends(userId, otherUserId))) {
      throw new AppError(403, 'FORBIDDEN', 'Vocês precisam se seguir para conversar');
    }
    const directKey = directKeyFor(userId, otherUserId);
    const conversation =
      (await this.conversations.findByDirectKey(directKey)) ??
      (await this.conversations.createDirect(directKey, [userId, otherUserId]));
    return this.get(userId, conversation.id);
  }

  async messages(
    userId: string,
    conversationId: string,
    query: MessagesQuery,
  ): Promise<MessageWithSender[]> {
    await this.requireParticipant(userId, conversationId);
    return this.conversations.listMessages(conversationId, query);
  }

  async send(userId: string, conversationId: string, body: string): Promise<MessageWithSender> {
    await this.requireParticipant(userId, conversationId);
    const message = await this.conversations.createMessage(conversationId, userId, body);
    await this.conversations.markRead(conversationId, userId, message.createdAt);
    return message;
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.requireParticipant(userId, conversationId);
    await this.conversations.markRead(conversationId, userId, new Date());
  }

  private async requireParticipant(userId: string, conversationId: string): Promise<void> {
    const participant = await this.conversations.findParticipant(conversationId, userId);
    if (!participant) throw AppError.notFound(CONVERSATION_NOT_FOUND);
  }
}
