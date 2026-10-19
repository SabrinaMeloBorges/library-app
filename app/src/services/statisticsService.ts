import type { StatisticsOverview } from '../types/api';
import { httpClient } from './httpClient';

export const statisticsService = {
  async overview(): Promise<StatisticsOverview> {
    const { data } = await httpClient.get<{ data: StatisticsOverview }>('/statistics/overview');
    return data.data;
  },
};
