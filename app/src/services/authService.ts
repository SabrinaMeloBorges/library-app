import type { AuthResponse, User } from '../types/api';
import { ApiError } from './apiError';
import { httpClient } from './httpClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  username?: string;
}

const isUser = (value: unknown): value is User => {
  const user = value as User;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string'
  );
};

const assertAuthResponse = (value: unknown): AuthResponse => {
  const response = value as AuthResponse;
  if (
    typeof response?.token !== 'string' ||
    response.token.length === 0 ||
    !isUser(response.user)
  ) {
    throw new ApiError('Resposta de autenticação inválida recebida da API.', null);
  }
  return response;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await httpClient.post<unknown>('/auth/login', credentials);
    return assertAuthResponse(data);
  },

  async register(payload: RegisterData): Promise<AuthResponse> {
    const { data } = await httpClient.post<unknown>('/auth/register', payload);
    return assertAuthResponse(data);
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await httpClient.post<unknown>('/auth/google', { idToken });
    return assertAuthResponse(data);
  },

  async me(): Promise<User> {
    const { data } = await httpClient.get<{ user: unknown }>('/auth/me');
    if (!isUser(data.user)) throw new ApiError('Usuário inválido recebido da API.', null);
    return data.user;
  },

  async logout(): Promise<void> {
    await httpClient.post('/auth/logout');
  },
};
