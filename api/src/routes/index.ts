import { Router, type RequestHandler } from 'express';
import type { Controllers } from '../config/container';

interface RouterDependencies {
  controllers: Controllers;
  authenticate: RequestHandler;
  authRateLimiter: RequestHandler;
}

const buildAuthRoutes = ({ controllers, authenticate, authRateLimiter }: RouterDependencies) => {
  const router = Router();
  router.post('/register', authRateLimiter, controllers.auth.register);
  router.post('/login', authRateLimiter, controllers.auth.login);
  router.get('/me', authenticate, controllers.auth.me);
  router.post('/logout', authenticate, controllers.auth.logout);
  return router;
};

const buildLibraryRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.library.list);
  router.post('/', controllers.library.create);
  router.get('/:id', controllers.library.get);
  router.patch('/:id', controllers.library.update);
  router.delete('/:id', controllers.library.remove);
  return router;
};

const buildReadingSessionRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.readingSessions.list);
  router.post('/', controllers.readingSessions.create);
  router.patch('/:id', controllers.readingSessions.update);
  router.delete('/:id', controllers.readingSessions.remove);
  return router;
};

const buildGoalRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.goals.list);
  router.post('/', controllers.goals.create);
  router.get('/:id', controllers.goals.get);
  router.patch('/:id', controllers.goals.update);
  router.delete('/:id', controllers.goals.remove);
  return router;
};

export const buildApiRouter = (dependencies: RouterDependencies): Router => {
  const router = Router();
  const { authenticate, controllers } = dependencies;

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  router.use('/auth', buildAuthRoutes(dependencies));
  router.use('/library', authenticate, buildLibraryRoutes(dependencies));
  router.use('/reading-sessions', authenticate, buildReadingSessionRoutes(dependencies));
  router.use('/goals', authenticate, buildGoalRoutes(dependencies));
  router.get('/statistics/overview', authenticate, controllers.statistics.overview);
  return router;
};
