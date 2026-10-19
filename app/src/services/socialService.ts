import type { User } from '../types/api';
import type {
  FeedActivity,
  Relationship,
  UnlockedAchievement,
  UserProfile,
  UserSummary,
  UserWithRelationship,
} from '../types/social';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

export interface ProfileUpdate {
  name?: string;
  username?: string;
  bio?: string | null;
  shareActivity?: boolean;
}

const userPath = (userId: string, suffix = ''): string =>
  `/users/${encodeURIComponent(userId)}${suffix}`;

export const socialService = {
  async search(query: string): Promise<UserWithRelationship[]> {
    const { data } = await httpClient.get<DataEnvelope<UserWithRelationship[]>>('/users/search', {
      params: { q: query },
    });
    return data.data;
  },

  async profile(userId: string): Promise<UserProfile> {
    const { data } = await httpClient.get<DataEnvelope<UserProfile>>(userPath(userId));
    return data.data;
  },

  async updateMe(changes: ProfileUpdate): Promise<User> {
    const { data } = await httpClient.patch<DataEnvelope<User>>('/users/me', changes);
    return data.data;
  },

  async follow(userId: string): Promise<Relationship> {
    const { data } = await httpClient.post<DataEnvelope<Relationship>>(userPath(userId, '/follow'));
    return data.data;
  },

  async unfollow(userId: string): Promise<Relationship> {
    const { data } = await httpClient.delete<DataEnvelope<Relationship>>(
      userPath(userId, '/follow'),
    );
    return data.data;
  },

  async followers(userId: string): Promise<UserWithRelationship[]> {
    const { data } = await httpClient.get<DataEnvelope<UserWithRelationship[]>>(
      userPath(userId, '/followers'),
    );
    return data.data;
  },

  async following(userId: string): Promise<UserWithRelationship[]> {
    const { data } = await httpClient.get<DataEnvelope<UserWithRelationship[]>>(
      userPath(userId, '/following'),
    );
    return data.data;
  },

  async friends(): Promise<UserSummary[]> {
    const { data } = await httpClient.get<DataEnvelope<UserSummary[]>>('/users/me/friends');
    return data.data;
  },

  async activities(userId: string): Promise<FeedActivity[]> {
    const { data } = await httpClient.get<DataEnvelope<FeedActivity[]>>(
      userPath(userId, '/activities'),
    );
    return data.data;
  },

  async achievements(userId: string): Promise<UnlockedAchievement[]> {
    const { data } = await httpClient.get<DataEnvelope<UnlockedAchievement[]>>(
      userPath(userId, '/achievements'),
    );
    return data.data;
  },
};
