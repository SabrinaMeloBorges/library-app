import type { ChatMessage, Conversation } from '../types/social';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

const conversationPath = (conversationId: string, suffix = ''): string =>
  `/conversations/${encodeURIComponent(conversationId)}${suffix}`;

export const chatService = {
  async list(): Promise<Conversation[]> {
    const { data } = await httpClient.get<DataEnvelope<Conversation[]>>('/conversations');
    return data.data;
  },

  async get(conversationId: string): Promise<Conversation> {
    const { data } = await httpClient.get<DataEnvelope<Conversation>>(
      conversationPath(conversationId),
    );
    return data.data;
  },

  async openDirect(userId: string): Promise<Conversation> {
    const { data } = await httpClient.post<DataEnvelope<Conversation>>('/conversations/direct', {
      userId,
    });
    return data.data;
  },

  async messages(conversationId: string, after?: string): Promise<ChatMessage[]> {
    const { data } = await httpClient.get<DataEnvelope<ChatMessage[]>>(
      conversationPath(conversationId, '/messages'),
      { params: after ? { after } : {} },
    );
    return data.data;
  },

  async send(conversationId: string, body: string): Promise<ChatMessage> {
    const { data } = await httpClient.post<DataEnvelope<ChatMessage>>(
      conversationPath(conversationId, '/messages'),
      { body },
    );
    return data.data;
  },

  async markRead(conversationId: string): Promise<void> {
    await httpClient.post(conversationPath(conversationId, '/read'));
  },
};
