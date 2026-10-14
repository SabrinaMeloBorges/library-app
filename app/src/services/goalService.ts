import type { ReadingGoal, ReadingGoalInput } from '../types/api';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

export const goalService = {
  async list(): Promise<ReadingGoal[]> {
    const { data } = await httpClient.get<DataEnvelope<ReadingGoal[]>>('/goals');
    return data.data;
  },

  async get(id: string): Promise<ReadingGoal> {
    const { data } = await httpClient.get<DataEnvelope<ReadingGoal>>(
      `/goals/${encodeURIComponent(id)}`,
    );
    return data.data;
  },

  async create(input: ReadingGoalInput): Promise<ReadingGoal> {
    const { data } = await httpClient.post<DataEnvelope<ReadingGoal>>('/goals', input);
    return data.data;
  },

  async update(id: string, changes: Partial<ReadingGoalInput>): Promise<ReadingGoal> {
    const { data } = await httpClient.patch<DataEnvelope<ReadingGoal>>(
      `/goals/${encodeURIComponent(id)}`,
      changes,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/goals/${encodeURIComponent(id)}`);
  },
};
