import { useCallback } from 'react';
import { statisticsService } from '../services/statisticsService';
import type { StatisticsOverview } from '../types/api';
import { useAsyncResource, type AsyncResource } from './useAsyncResource';

export const useStatistics = (): AsyncResource<StatisticsOverview> => {
  const loader = useCallback(() => statisticsService.overview(), []);
  return useAsyncResource(loader);
};
