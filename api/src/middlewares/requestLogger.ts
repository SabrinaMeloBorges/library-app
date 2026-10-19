import type { NextFunction, Request, Response } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();
  const pathWithoutQuery = req.originalUrl.split('?')[0];
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.info(`${req.method} ${pathWithoutQuery} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`);
  });
  next();
};
