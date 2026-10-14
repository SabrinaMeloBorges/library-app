import type { AchievementStatus, UnlockedAchievement } from '../types/social';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

export const achievementService = {
  async list(): Promise<AchievementStatus[]> {
    const { data } = await httpClient.get<DataEnvelope<AchievementStatus[]>>('/achievements');
    return data.data;
  },

  async pending(): Promise<UnlockedAchievement[]> {
    const { data } =
      await httpClient.get<DataEnvelope<UnlockedAchievement[]>>('/achievements/pending');
    return data.data;
  },

  async markSeen(codes: string[]): Promise<void> {
    await httpClient.post('/achievements/seen', { codes });
  },
};
