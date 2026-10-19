import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { StatisticsService } from '../services/statisticsService';
import { presentOverview } from './presenters';

export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  overview = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    res.json({ data: presentOverview(await this.statisticsService.overview(userId)) });
  };
}
