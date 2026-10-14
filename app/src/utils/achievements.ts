import type { AppColors } from '../theme/colors';
import type { AchievementTier } from '../types/social';

export const ACHIEVEMENT_ICONS: Record<string, string> = {
  FIRST_LOGIN: 'door-open',
  FIRST_BOOK: 'bookshelf',
  FIRST_SESSION: 'bookmark-check-outline',
  PAGES_100: 'book-open-page-variant-outline',
  FIRST_REVIEW: 'feather',
  FIRST_FRIEND: 'account-heart-outline',
  FIRST_CLUB: 'account-group-outline',
  FIRST_BOOK_FINISHED: 'book-check-outline',
  FIRST_GOAL: 'flag-checkered',
  PAGES_1000: 'library',
  STREAK_7: 'calendar-check-outline',
  HOURS_10: 'timer-sand',
  BOOKS_10: 'crown-outline',
  PAGES_5000: 'castle',
  STREAK_30: 'fire',
  GOALS_5: 'trophy-outline',
};

export const TIER_LABELS: Record<AchievementTier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Prata',
  GOLD: 'Ouro',
};

export const tierColor = (tier: AchievementTier, colors: AppColors): string =>
  tier === 'GOLD' ? colors.gold : tier === 'SILVER' ? colors.silver : colors.bronze;

export const achievementIcon = (code: string): string => ACHIEVEMENT_ICONS[code] ?? 'medal-outline';
