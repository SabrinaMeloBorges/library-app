import type { AppConfig } from './env';
import { AuthController } from '../controllers/authController';
import { LibraryController } from '../controllers/libraryController';
import { ReadingGoalController } from '../controllers/readingGoalController';
import { ReadingSessionController } from '../controllers/readingSessionController';
import { StatisticsController } from '../controllers/statisticsController';
import type { Repositories } from '../repositories/contracts';
import { AuthService } from '../services/authService';
import { LibraryService } from '../services/libraryService';
import { ReadingGoalService } from '../services/readingGoalService';
import { ReadingSessionService } from '../services/readingSessionService';
import { StatisticsService } from '../services/statisticsService';

export interface Services {
  auth: AuthService;
  library: LibraryService;
  readingSessions: ReadingSessionService;
  goals: ReadingGoalService;
  statistics: StatisticsService;
}

export interface Controllers {
  auth: AuthController;
  library: LibraryController;
  readingSessions: ReadingSessionController;
  goals: ReadingGoalController;
  statistics: StatisticsController;
}

export const createServices = (repositories: Repositories, config: AppConfig): Services => {
  const goals = new ReadingGoalService(
    repositories.readingGoals,
    repositories.readingSessions,
    repositories.userBooks,
    config.APP_TIMEZONE,
  );
  return {
    auth: new AuthService(repositories.users, repositories.authSessions, config),
    library: new LibraryService(repositories.books, repositories.userBooks),
    readingSessions: new ReadingSessionService(
      repositories.readingSessions,
      repositories.userBooks,
    ),
    goals,
    statistics: new StatisticsService(repositories.readingGoals, goals, config.APP_TIMEZONE),
  };
};

export const createControllers = (services: Services): Controllers => ({
  auth: new AuthController(services.auth),
  library: new LibraryController(services.library),
  readingSessions: new ReadingSessionController(services.readingSessions),
  goals: new ReadingGoalController(services.goals),
  statistics: new StatisticsController(services.statistics),
});
