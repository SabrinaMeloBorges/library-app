import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import type { AppConfig } from './config/env';
import { createControllers, createServices } from './config/container';
import { openApiDocument } from './docs/openapi';
import { createAuthenticate } from './middlewares/authenticate';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';
import { createCors, createRateLimiters } from './middlewares/security';
import type { Repositories } from './repositories/contracts';
import { buildApiRouter } from './routes';

export interface AppDependencies {
  config: AppConfig;
  repositories: Repositories;
}

export const createApp = ({ config, repositories }: AppDependencies): Express => {
  const app = express();
  const services = createServices(repositories, config);
  const controllers = createControllers(services);
  const rateLimiters = createRateLimiters(config);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(createCors(config.CORS_ORIGINS));
  app.use(express.json({ limit: '50kb' }));
  if (config.NODE_ENV !== 'test') app.use(requestLogger);

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get('/docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api/v1',
    rateLimiters.general,
    buildApiRouter({
      controllers,
      authenticate: createAuthenticate(services.auth),
      authRateLimiter: rateLimiters.auth,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
