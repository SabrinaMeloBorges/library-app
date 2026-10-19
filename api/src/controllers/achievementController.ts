import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { AchievementService } from '../services/achievementService';
import { parseOrThrow } from '../validators/parse';
import { markSeenSchema } from '../validators/socialValidators';
import { presentAchievementStatus, presentUnlockedAchievement } from './socialPresenters';

export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const statuses = await this.achievementService.list(userId);
    res.json({ data: statuses.map(presentAchievementStatus) });
  };

  pending = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const pending = await this.achievementService.pending(userId);
    res.json({ data: pending.map(presentUnlockedAchievement) });
  };

  markSeen = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { codes } = parseOrThrow(markSeenSchema, req.body);
    await this.achievementService.markSeen(userId, codes);
    res.status(204).send();
  };
}
