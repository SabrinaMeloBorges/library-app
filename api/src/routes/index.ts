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
  router.post('/google', authRateLimiter, controllers.auth.google);
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
  router.use('/users', authenticate, buildUserRoutes(dependencies));
  router.get('/feed', authenticate, controllers.feed.feed);
  router.use('/activities', authenticate, buildActivityRoutes(dependencies));
  router.use('/achievements', authenticate, buildAchievementRoutes(dependencies));
  router.use('/clubs', authenticate, buildClubRoutes(dependencies));
  router.use('/conversations', authenticate, buildConversationRoutes(dependencies));
  return router;
};

const buildUserRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/search', controllers.social.search);
  router.patch('/me', controllers.social.updateMe);
  router.get('/me/friends', controllers.social.friends);
  router.get('/:id', controllers.social.profile);
  router.post('/:id/follow', controllers.social.follow);
  router.delete('/:id/follow', controllers.social.unfollow);
  router.get('/:id/followers', controllers.social.followers);
  router.get('/:id/following', controllers.social.following);
  router.get('/:id/activities', controllers.social.activities);
  router.get('/:id/achievements', controllers.social.achievements);
  return router;
};

const buildActivityRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.post('/:id/likes', controllers.feed.like);
  router.delete('/:id/likes', controllers.feed.unlike);
  router.get('/:id/comments', controllers.feed.comments);
  router.post('/:id/comments', controllers.feed.addComment);
  router.delete('/:id/comments/:commentId', controllers.feed.deleteComment);
  return router;
};

const buildAchievementRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.achievements.list);
  router.get('/pending', controllers.achievements.pending);
  router.post('/seen', controllers.achievements.markSeen);
  return router;
};

const buildClubRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.clubs.list);
  router.post('/', controllers.clubs.create);
  router.post('/join', controllers.clubs.join);
  router.get('/:id', controllers.clubs.get);
  router.patch('/:id', controllers.clubs.update);
  router.delete('/:id', controllers.clubs.remove);
  router.post('/:id/members', controllers.clubs.addMember);
  router.delete('/:id/members/:userId', controllers.clubs.removeMember);
  router.post('/:id/goals', controllers.clubs.createGoal);
  router.patch('/:id/goals/:goalId', controllers.clubs.updateGoal);
  router.delete('/:id/goals/:goalId', controllers.clubs.removeGoal);
  return router;
};

const buildConversationRoutes = ({ controllers }: RouterDependencies) => {
  const router = Router();
  router.get('/', controllers.chat.list);
  router.post('/direct', controllers.chat.openDirect);
  router.get('/:id', controllers.chat.get);
  router.get('/:id/messages', controllers.chat.messages);
  router.post('/:id/messages', controllers.chat.send);
  router.post('/:id/read', controllers.chat.markRead);
  return router;
};
