import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { ReadingGoalService } from '../services/readingGoalService';
import { idParamSchema } from '../validators/common';
import { createGoalSchema, updateGoalSchema } from '../validators/goalValidators';
import { parseOrThrow } from '../validators/parse';
import { presentGoal } from './presenters';

export class ReadingGoalController {
  constructor(private readonly goalService: ReadingGoalService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const goals = await this.goalService.list(userId);
    res.json({ data: goals.map(presentGoal) });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentGoal(await this.goalService.get(userId, id)) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const input = parseOrThrow(createGoalSchema, req.body);
    res.status(201).json({ data: presentGoal(await this.goalService.create(userId, input)) });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(updateGoalSchema, req.body);
    res.json({ data: presentGoal(await this.goalService.update(userId, id, input)) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    await this.goalService.remove(userId, id);
    res.status(204).send();
  };
}
