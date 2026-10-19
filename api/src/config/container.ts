import type { AppConfig } from './env';
import { AchievementController } from '../controllers/achievementController';
import { AuthController } from '../controllers/authController';
import { ChatController } from '../controllers/chatController';
import { ClubController } from '../controllers/clubController';
import { FeedController } from '../controllers/feedController';
import { LibraryController } from '../controllers/libraryController';
import { ReadingGoalController } from '../controllers/readingGoalController';
import { ReadingSessionController } from '../controllers/readingSessionController';
import { SocialController } from '../controllers/socialController';
import { StatisticsController } from '../controllers/statisticsController';
import type { Repositories } from '../repositories/contracts';
import { AchievementService } from '../services/achievementService';
import { ActivityService } from '../services/activityService';
import { AuthService } from '../services/authService';
import { ChatService } from '../services/chatService';
import { ClubProgressService } from '../services/clubProgressService';
import { ClubService } from '../services/clubService';
import { EngagementService } from '../services/engagementService';
import type { GoogleTokenVerifier } from '../services/googleTokenVerifier';
import { LibraryService } from '../services/libraryService';
import { ReadingGoalService } from '../services/readingGoalService';
import { ReadingSessionService } from '../services/readingSessionService';
import { ReadingSnapshotService } from '../services/readingSnapshotService';
import { SocialService } from '../services/socialService';
import { StatisticsService } from '../services/statisticsService';

export interface Services {
  auth: AuthService;
  library: LibraryService;
  readingSessions: ReadingSessionService;
  goals: ReadingGoalService;
  statistics: StatisticsService;
  social: SocialService;
  activities: ActivityService;
  achievements: AchievementService;
  clubs: ClubService;
  chat: ChatService;
}

export interface Controllers {
  auth: AuthController;
  library: LibraryController;
  readingSessions: ReadingSessionController;
  goals: ReadingGoalController;
  statistics: StatisticsController;
  social: SocialController;
  feed: FeedController;
  achievements: AchievementController;
  clubs: ClubController;
  chat: ChatController;
}

export const createServices = (
  repositories: Repositories,
  config: AppConfig,
  googleVerifier: GoogleTokenVerifier | null = null,
): Services => {
  const timeZone = config.APP_TIMEZONE;
  const snapshots = new ReadingSnapshotService(
    repositories.readingSessions,
    repositories.userBooks,
  );
  const activities = new ActivityService(
    repositories.activities,
    repositories.follows,
    repositories.users,
  );
  const clubProgress = new ClubProgressService(repositories.clubs, snapshots, timeZone);
  const achievements = new AchievementService(
    repositories.achievements,
    repositories.users,
    repositories.readingGoals,
    repositories.follows,
    repositories.clubs,
    snapshots,
    clubProgress,
    activities,
    timeZone,
  );
  const engagement = new EngagementService(activities, achievements);
  const goals = new ReadingGoalService(repositories.readingGoals, snapshots, engagement, timeZone);
  const social = new SocialService(
    repositories.users,
    repositories.follows,
    snapshots,
    achievements,
    engagement,
  );

  return {
    auth: new AuthService(
      repositories.users,
      repositories.authSessions,
      engagement,
      config,
      googleVerifier,
    ),
    library: new LibraryService(repositories.books, repositories.userBooks, engagement),
    readingSessions: new ReadingSessionService(
      repositories.readingSessions,
      repositories.userBooks,
      engagement,
    ),
    goals,
    statistics: new StatisticsService(repositories.readingGoals, goals, timeZone),
    social,
    activities,
    achievements,
    clubs: new ClubService(
      repositories.clubs,
      repositories.readingGoals,
      repositories.books,
      repositories.userBooks,
      repositories.conversations,
      social,
      clubProgress,
      engagement,
    ),
    chat: new ChatService(repositories.conversations, repositories.users, social),
  };
};

export const createControllers = (services: Services): Controllers => ({
  auth: new AuthController(services.auth),
  library: new LibraryController(services.library),
  readingSessions: new ReadingSessionController(services.readingSessions),
  goals: new ReadingGoalController(services.goals),
  statistics: new StatisticsController(services.statistics),
  social: new SocialController(services.social, services.activities, services.achievements),
  feed: new FeedController(services.activities),
  achievements: new AchievementController(services.achievements),
  clubs: new ClubController(services.clubs),
  chat: new ChatController(services.chat),
});
