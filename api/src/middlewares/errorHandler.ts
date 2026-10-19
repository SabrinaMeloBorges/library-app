import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

interface BodyParserError {
  type?: string;
  status?: number;
}

const isBodyParserError = (error: unknown): error is BodyParserError =>
  typeof error === 'object' && error !== null && 'type' in error && 'status' in error;

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  if (isBodyParserError(error)) {
    const tooLarge = error.type === 'entity.too.large';
    res.status(tooLarge ? 413 : 400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: tooLarge ? 'Corpo da requisição muito grande' : 'JSON inválido',
      },
    });
    return;
  }

  const name = error instanceof Error ? error.name : 'UnknownError';
  console.error(`[error] ${req.method} ${req.path} -> ${name}`);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' } });
};
