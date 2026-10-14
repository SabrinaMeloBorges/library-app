import axios, { type AxiosError } from 'axios';
import { API_BASE_URL } from './apiConfig';
import { toApiError } from './apiError';

type UnauthorizedHandler = () => void;

const REQUEST_TIMEOUT_MS = 15000;

let authToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const setUnauthorizedHandler = (handler: UnauthorizedHandler | null): void => {
  unauthorizedHandler = handler;
};

httpClient.interceptors.request.use((config) => {
  if (authToken) config.headers.set('Authorization', `Bearer ${authToken}`);
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) unauthorizedHandler?.();
    return Promise.reject(toApiError(error));
  },
);
