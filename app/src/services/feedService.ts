import type { ActivityComment, FeedActivity } from '../types/social';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

const activityPath = (activityId: string, suffix: string): string =>
  `/activities/${encodeURIComponent(activityId)}${suffix}`;

export const feedService = {
  async feed(before?: string): Promise<FeedActivity[]> {
    const { data } = await httpClient.get<DataEnvelope<FeedActivity[]>>('/feed', {
      params: before ? { before } : {},
    });
    return data.data;
  },

  async like(activityId: string): Promise<FeedActivity> {
    const { data } = await httpClient.post<DataEnvelope<FeedActivity>>(
      activityPath(activityId, '/likes'),
    );
    return data.data;
  },

  async unlike(activityId: string): Promise<FeedActivity> {
    const { data } = await httpClient.delete<DataEnvelope<FeedActivity>>(
      activityPath(activityId, '/likes'),
    );
    return data.data;
  },

  async comments(activityId: string): Promise<ActivityComment[]> {
    const { data } = await httpClient.get<DataEnvelope<ActivityComment[]>>(
      activityPath(activityId, '/comments'),
    );
    return data.data;
  },

  async addComment(activityId: string, body: string): Promise<ActivityComment> {
    const { data } = await httpClient.post<DataEnvelope<ActivityComment>>(
      activityPath(activityId, '/comments'),
      { body },
    );
    return data.data;
  },

  async deleteComment(activityId: string, commentId: string): Promise<void> {
    await httpClient.delete(activityPath(activityId, `/comments/${encodeURIComponent(commentId)}`));
  },
};
