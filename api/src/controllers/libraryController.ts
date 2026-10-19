import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { LibraryService } from '../services/libraryService';
import { idParamSchema } from '../validators/common';
import {
  createLibraryItemSchema,
  libraryQuerySchema,
  updateLibraryItemSchema,
} from '../validators/libraryValidators';
import { parseOrThrow } from '../validators/parse';
import { presentLibraryItem } from './presenters';

export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const query = parseOrThrow(libraryQuerySchema, req.query);
    const items = await this.libraryService.list(userId, query);
    res.json({ data: items.map(presentLibraryItem) });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentLibraryItem(await this.libraryService.get(userId, id)) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const input = parseOrThrow(createLibraryItemSchema, req.body);
    res
      .status(201)
      .json({ data: presentLibraryItem(await this.libraryService.create(userId, input)) });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(updateLibraryItemSchema, req.body);
    res.json({ data: presentLibraryItem(await this.libraryService.update(userId, id, input)) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    await this.libraryService.remove(userId, id);
    res.status(204).send();
  };
}
