import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { ClubService } from '../services/clubService';
import {
  addMemberSchema,
  clubGoalParamsSchema,
  createClubSchema,
  joinClubSchema,
  memberParamsSchema,
  updateClubSchema,
} from '../validators/clubValidators';
import { idParamSchema } from '../validators/common';
import { createGoalSchema, updateGoalSchema } from '../validators/goalValidators';
import { parseOrThrow } from '../validators/parse';
import { presentClubDetails, presentClubSummary } from './socialPresenters';

export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const clubs = await this.clubService.list(userId);
    res.json({ data: clubs.map((club) => presentClubSummary(club, userId)) });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const input = parseOrThrow(createClubSchema, req.body);
    res
      .status(201)
      .json({ data: presentClubDetails(await this.clubService.create(userId, input)) });
  };

  join = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { inviteCode } = parseOrThrow(joinClubSchema, req.body);
    res.json({ data: presentClubDetails(await this.clubService.join(userId, inviteCode)) });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    res.json({ data: presentClubDetails(await this.clubService.get(userId, id)) });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(updateClubSchema, req.body);
    res.json({ data: presentClubDetails(await this.clubService.update(userId, id, input)) });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    await this.clubService.remove(userId, id);
    res.status(204).send();
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const { userId: memberId } = parseOrThrow(addMemberSchema, req.body);
    res.json({ data: presentClubDetails(await this.clubService.addMember(userId, id, memberId)) });
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id, userId: memberId } = parseOrThrow(memberParamsSchema, req.params);
    await this.clubService.removeMember(userId, id, memberId);
    res.status(204).send();
  };

  createGoal = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id } = parseOrThrow(idParamSchema, req.params);
    const input = parseOrThrow(createGoalSchema, req.body);
    const details = await this.clubService.createGoal(userId, id, input);
    res.status(201).json({ data: presentClubDetails(details) });
  };

  updateGoal = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id, goalId } = parseOrThrow(clubGoalParamsSchema, req.params);
    const input = parseOrThrow(updateGoalSchema, req.body);
    const details = await this.clubService.updateGoal(userId, id, goalId, input);
    res.json({ data: presentClubDetails(details) });
  };

  removeGoal = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    const { id, goalId } = parseOrThrow(clubGoalParamsSchema, req.params);
    await this.clubService.removeGoal(userId, id, goalId);
    res.status(204).send();
  };
}
