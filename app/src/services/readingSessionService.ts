import type { ReadingSession, ReadingSessionInput, ReadingSessionUpdate } from '../types/api';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

export const readingSessionService = {
  async list(params: { userBookId?: string; limit?: number } = {}): Promise<ReadingSession[]> {
    const { data } = await httpClient.get<DataEnvelope<ReadingSession[]>>('/reading-sessions', {
      params,
    });
    return data.data;
  },

  async create(input: ReadingSessionInput): Promise<ReadingSession> {
    const { data } = await httpClient.post<DataEnvelope<ReadingSession>>(
      '/reading-sessions',
      input,
    );
    return data.data;
  },

  async update(id: string, changes: ReadingSessionUpdate): Promise<ReadingSession> {
    const { data } = await httpClient.patch<DataEnvelope<ReadingSession>>(
      `/reading-sessions/${encodeURIComponent(id)}`,
      changes,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/reading-sessions/${encodeURIComponent(id)}`);
  },
};
