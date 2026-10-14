import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { ChatService } from '../services/chatService';
import {
  messagesQuerySchema,
  openDirectSchema,
  sendMessageSchema,
} from '../validators/chatValidators';
import { idParamSchema } from '../validators/common';
import { parseOrThrow } from '../validators/parse';
import { presentConversation, presentMessage } from './socialPresenters';

export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const conversations = await this.chatService.list(userId);
    res.json({ data: conversations.map(presentConversation) });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentConversation(await this.chatService.get(userId, id)) });
  };

  openDirect = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { userId: otherUserId } = parseOrThrow(openDirectSchema, req.body);
    res.json({ data: presentConversation(await this.chatService.openDirect(userId, otherUserId)) });
  };

  messages = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const query = parseOrThrow(messagesQuerySchema, req.query);
    const messages = await this.chatService.messages(userId, id, query);
    res.json({ data: messages.map(presentMessage) });
  };

  send = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { body } = parseOrThrow(sendMessageSchema, req.body);
    res.status(201).json({ data: presentMessage(await this.chatService.send(userId, id, body)) });
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    await this.chatService.markRead(userId, id);
    res.status(204).send();
  };
}
