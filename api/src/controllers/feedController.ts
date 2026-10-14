import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { ActivityService } from '../services/activityService';
import { idParamSchema } from '../validators/common';
import { parseOrThrow } from '../validators/parse';
import {
  commentParamsSchema,
  commentSchema,
  feedQuerySchema,
} from '../validators/socialValidators';
import { presentActivity, presentComment } from './socialPresenters';

export class FeedController {
  constructor(private readonly activityService: ActivityService) {}

  feed = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { before, limit } = parseOrThrow(feedQuerySchema, req.query);
    const views = await this.activityService.feed(userId, before, limit);
    res.json({ data: views.map(presentActivity) });
  };

  like = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentActivity(await this.activityService.like(userId, id)) });
  };

  unlike = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentActivity(await this.activityService.unlike(userId, id)) });
  };

  comments = async (req: Request, res: Response): Promise<void> => {
    requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const comments = await this.activityService.comments(id);
    res.json({ data: comments.map(presentComment) });
  };

  addComment = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { body } = parseOrThrow(commentSchema, req.body);
    const comment = await this.activityService.addComment(userId, id, body);
    res.status(201).json({ data: presentComment(comment) });
  };

  deleteComment = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id, commentId } = parseOrThrow(commentParamsSchema, req.params);
    await this.activityService.deleteComment(userId, id, commentId);
    res.status(204).send();
  };
}
