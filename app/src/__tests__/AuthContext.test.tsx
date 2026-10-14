import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { httpClient } from '../services/httpClient';

const TOKEN = 'header.payload.signature';
const USER = {
  id: 'user-1',
  name: 'Ana Leitora',
  email: 'ana@example.com',
  createdAt: '2026-01-01',
};
const TOKEN_KEY = 'library.auth.token';

const respond = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse => ({
  config,
  status,
  data,
  statusText: String(status),
  headers: new AxiosHeaders(),
});

const reject = (config: InternalAxiosRequestConfig, status: number, message: string) =>
  Promise.reject(
    new AxiosError(
      message,
      'ERR_BAD_REQUEST',
      config,
      null,
      respond(config, status, { error: { code: 'X', message } }),
    ),
  );

const requests: { url?: string; authorization?: unknown }[] = [];

const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
  const authorization = config.headers.get('Authorization');
  requests.push({ url: config.url, authorization });
  const isAuthorized = authorization === `Bearer ${TOKEN}`;

  switch (config.url) {
    case '/auth/login': {
      const body = JSON.parse(config.data as string) as { password: string };
      if (body.password !== 'senha12345') return reject(config, 401, 'E-mail ou senha incorretos');
      return respond(config, 200, { token: TOKEN, expiresAt: '2026-12-31', user: USER });
    }
    case '/auth/me':
      return isAuthorized
        ? respond(config, 200, { user: USER })
        : reject(config, 401, 'Token inválido');
    case '/auth/logout':
      return isAuthorized ? respond(config, 204, '') : reject(config, 401, 'Token inválido');
    default:
      return reject(config, 404, 'Rota não encontrada');
  }
});

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeAll(() => {
  httpClient.defaults.adapter = adapter;
});

beforeEach(async () => {
  requests.length = 0;
  adapter.mockClear();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
});

describe('AuthContext', () => {
  it('faz login, envia o token nos headers e persiste a sessão no SecureStore', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);

    await act(() => result.current.login({ email: USER.email, password: 'senha12345' }));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(USER);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBe(TOKEN);
    const meRequest = requests.find((request) => request.url === '/auth/me');
    expect(meRequest?.authorization).toBe(`Bearer ${TOKEN}`);
    const loginRequest = requests.find((request) => request.url === '/auth/login');
    expect(loginRequest?.authorization).toBeUndefined();
  });

  it('propaga erro de credenciais sem autenticar', async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(
      act(() => result.current.login({ email: USER.email, password: 'errada123' })),
    ).rejects.toThrow('E-mail ou senha incorretos');
    expect(result.current.isAuthenticated).toBe(false);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  it('restaura a sessão salva ao iniciar', async () => {
    await SecureStore.setItemAsync(TOKEN_KEY, TOKEN);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.token).toBe(TOKEN);
  });

  it('descarta token inválido salvo', async () => {
    await SecureStore.setItemAsync(TOKEN_KEY, 'token.invalido.salvo');
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  it('faz logout no servidor e remove a sessão local', async () => {
    await SecureStore.setItemAsync(TOKEN_KEY, TOKEN);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(() => result.current.logout());

    expect(requests.some((request) => request.url === '/auth/logout')).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });
});
