import type { ReadingGoalInput } from '../types/api';
import type { ClubDetails, ClubSummary } from '../types/social';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

export interface ClubInput {
  name: string;
  description?: string | null;
  currentUserBookId?: string | null;
}

const clubPath = (clubId: string, suffix = ''): string =>
  `/clubs/${encodeURIComponent(clubId)}${suffix}`;

export const clubService = {
  async list(): Promise<ClubSummary[]> {
    const { data } = await httpClient.get<DataEnvelope<ClubSummary[]>>('/clubs');
    return data.data;
  },

  async get(clubId: string): Promise<ClubDetails> {
    const { data } = await httpClient.get<DataEnvelope<ClubDetails>>(clubPath(clubId));
    return data.data;
  },

  async create(input: ClubInput): Promise<ClubDetails> {
    const { data } = await httpClient.post<DataEnvelope<ClubDetails>>('/clubs', input);
    return data.data;
  },

  async update(clubId: string, changes: Partial<ClubInput>): Promise<ClubDetails> {
    const { data } = await httpClient.patch<DataEnvelope<ClubDetails>>(clubPath(clubId), changes);
    return data.data;
  },

  async remove(clubId: string): Promise<void> {
    await httpClient.delete(clubPath(clubId));
  },

  async join(inviteCode: string): Promise<ClubDetails> {
    const { data } = await httpClient.post<DataEnvelope<ClubDetails>>('/clubs/join', {
      inviteCode,
    });
    return data.data;
  },

  async addMember(clubId: string, userId: string): Promise<ClubDetails> {
    const { data } = await httpClient.post<DataEnvelope<ClubDetails>>(
      clubPath(clubId, '/members'),
      { userId },
    );
    return data.data;
  },

  async removeMember(clubId: string, userId: string): Promise<void> {
    await httpClient.delete(clubPath(clubId, `/members/${encodeURIComponent(userId)}`));
  },

  async createGoal(clubId: string, input: ReadingGoalInput): Promise<ClubDetails> {
    const { data } = await httpClient.post<DataEnvelope<ClubDetails>>(
      clubPath(clubId, '/goals'),
      input,
    );
    return data.data;
  },

  async updateGoal(
    clubId: string,
    goalId: string,
    changes: Partial<ReadingGoalInput>,
  ): Promise<ClubDetails> {
    const { data } = await httpClient.patch<DataEnvelope<ClubDetails>>(
      clubPath(clubId, `/goals/${encodeURIComponent(goalId)}`),
      changes,
    );
    return data.data;
  },

  async removeGoal(clubId: string, goalId: string): Promise<void> {
    await httpClient.delete(clubPath(clubId, `/goals/${encodeURIComponent(goalId)}`));
  },
};
