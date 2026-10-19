import type { LibraryItem, LibraryItemInput, LibraryItemUpdate, LibraryQuery } from '../types/api';
import { httpClient } from './httpClient';

interface DataEnvelope<T> {
  data: T;
}

const toQueryParams = (query: LibraryQuery): Record<string, string> => {
  const params: Record<string, string> = {};
  if (query.status) params.status = query.status;
  if (query.q && query.q.trim().length > 0) params.q = query.q.trim();
  if (query.favorites) params.favorites = 'true';
  if (query.sort) params.sort = query.sort;
  if (query.order) params.order = query.order;
  return params;
};

export const libraryService = {
  async list(query: LibraryQuery = {}): Promise<LibraryItem[]> {
    const { data } = await httpClient.get<DataEnvelope<LibraryItem[]>>('/library', {
      params: toQueryParams(query),
    });
    return data.data;
  },

  async get(id: string): Promise<LibraryItem> {
    const { data } = await httpClient.get<DataEnvelope<LibraryItem>>(
      `/library/${encodeURIComponent(id)}`,
    );
    return data.data;
  },

  async create(input: LibraryItemInput): Promise<LibraryItem> {
    const { data } = await httpClient.post<DataEnvelope<LibraryItem>>('/library', input);
    return data.data;
  },

  async update(id: string, changes: LibraryItemUpdate): Promise<LibraryItem> {
    const { data } = await httpClient.patch<DataEnvelope<LibraryItem>>(
      `/library/${encodeURIComponent(id)}`,
      changes,
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await httpClient.delete(`/library/${encodeURIComponent(id)}`);
  },
};
