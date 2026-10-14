import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import type { AuthService } from '../services/authService';

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/;

export const createAuthenticate =
  (authService: AuthService) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const match = BEARER_PATTERN.exec(req.headers.authorization ?? '');
    if (!match) throw AppError.unauthorized('Token de acesso ausente ou mal formatado');
    req.auth = await authService.verifyToken(match[1]);
    next();
  };

export const requireAuth = (req: Request): { userId: string; sessionId: string } => {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
};
