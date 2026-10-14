import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { AchievementService } from '../services/achievementService';
import type { ActivityService } from '../services/activityService';
import type { SocialService } from '../services/socialService';
import { idParamSchema } from '../validators/common';
import { parseOrThrow } from '../validators/parse';
import {
  feedQuerySchema,
  updateProfileSchema,
  userSearchSchema,
} from '../validators/socialValidators';
import {
  presentActivity,
  presentMe,
  presentProfile,
  presentUnlockedAchievement,
  presentUserWithRelationship,
} from './socialPresenters';

export class SocialController {
  constructor(
    private readonly socialService: SocialService,
    private readonly activityService: ActivityService,
    private readonly achievementService: AchievementService,
  ) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { q } = parseOrThrow(userSearchSchema, req.query);
    const users = await this.socialService.search(userId, q);
    res.json({ data: users.map(presentUserWithRelationship) });
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const input = parseOrThrow(updateProfileSchema, req.body);
    res.json({ data: presentMe(await this.socialService.updateMe(userId, input)) });
  };

  friends = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    res.json({ data: await this.socialService.friends(userId) });
  };

  profile = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentProfile(await this.socialService.profile(userId, id)) });
  };

  follow = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: await this.socialService.follow(userId, id) });
  };

  unfollow = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: await this.socialService.unfollow(userId, id) });
  };

  followers = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const users = await this.socialService.followers(userId, id);
    res.json({ data: users.map(presentUserWithRelationship) });
  };

  following = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const users = await this.socialService.following(userId, id);
    res.json({ data: users.map(presentUserWithRelationship) });
  };

  activities = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { before, limit } = parseOrThrow(feedQuerySchema, req.query);
    const views = await this.activityService.userActivities(userId, id, before, limit);
    res.json({ data: views.map(presentActivity) });
  };

  achievements = async (req: Request, res: Response): Promise<void> => {
    requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const unlocked = await this.achievementService.listUnlocked(id);
    res.json({ data: unlocked.map(presentUnlockedAchievement) });
  };
}
