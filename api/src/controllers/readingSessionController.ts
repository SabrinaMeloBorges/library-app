import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { ReadingSessionService } from '../services/readingSessionService';
import { idParamSchema } from '../validators/common';
import { parseOrThrow } from '../validators/parse';
import {
  createReadingSessionSchema,
  readingSessionQuerySchema,
  updateReadingSessionSchema,
} from '../validators/readingSessionValidators';
import { presentReadingSession } from './presenters';

export class ReadingSessionController {
  constructor(private readonly sessionService: ReadingSessionService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const query = parseOrThrow(readingSessionQuerySchema, req.query);
    const sessions = await this.sessionService.list(userId, query);
    res.json({ data: sessions.map(presentReadingSession) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const input = parseOrThrow(createReadingSessionSchema, req.body);
    const session = await this.sessionService.create(userId, input);
    res.status(201).json({ data: presentReadingSession(session) });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(updateReadingSessionSchema, req.body);
    const session = await this.sessionService.update(userId, id, input);
    res.json({ data: presentReadingSession(session) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    await this.sessionService.remove(userId, id);
    res.status(204).send();
  };
}
