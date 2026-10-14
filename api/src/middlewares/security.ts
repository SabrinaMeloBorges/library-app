import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../config/env';

const MINUTE_MS = 60 * 1000;

const rateLimitResponse = {
  error: { code: 'RATE_LIMITED', message: 'Muitas requisições. Tente novamente em instantes.' },
};

export const createCors = (allowedOrigins: string[]): RequestHandler => {
  const options: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  };
  return cors(options);
};

export const createRateLimiters = (
  config: Pick<
    AppConfig,
    'RATE_LIMIT_WINDOW_MINUTES' | 'RATE_LIMIT_MAX_REQUESTS' | 'AUTH_RATE_LIMIT_MAX_REQUESTS'
  >,
): { general: RequestHandler; auth: RequestHandler } => {
  const windowMs = config.RATE_LIMIT_WINDOW_MINUTES * MINUTE_MS;
  return {
    general: rateLimit({
      windowMs,
      limit: config.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: rateLimitResponse,
    }),
    auth: rateLimit({
      windowMs,
      limit: config.AUTH_RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: rateLimitResponse,
    }),
  };
};
