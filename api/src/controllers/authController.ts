import type { Request, Response } from 'express';
import { requireAuth } from '../middlewares/authenticate';
import type { AuthService } from '../services/authService';
import { loginSchema, registerSchema } from '../validators/authValidators';
import { parseOrThrow } from '../validators/parse';
import { presentMe } from './socialPresenters';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(registerSchema, req.body);
    res.status(201).json(await this.authService.register(input));
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(loginSchema, req.body);
    res.json(await this.authService.login(input));
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const { userId } = requireAuth(req);
    res.json({ user: presentMe(await this.authService.getProfile(userId)) });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = requireAuth(req);
    await this.authService.logout(sessionId);
    res.status(204).send();
  };
}
