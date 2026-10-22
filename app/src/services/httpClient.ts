import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './apiConfig';
import { toApiError } from './apiError';

type UnauthorizedHandler = () => void;
type RetryableConfig = InternalAxiosRequestConfig & { retryCount?: number };

const REQUEST_TIMEOUT_MS = 60000;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000, 30000];
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const SAFE_METHODS = new Set(['get', 'head', 'options']);

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error: AxiosError, config: RetryableConfig): boolean => {
  if ((config.retryCount ?? 0) >= RETRY_DELAYS_MS.length) return false;
  if (error.response) return RETRYABLE_STATUS.has(error.response.status);
  return SAFE_METHODS.has((config.method ?? 'get').toLowerCase()) || error.code !== 'ECONNABORTED';
};

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
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    if (config && shouldRetry(error, config)) {
      const attempt = config.retryCount ?? 0;
      config.retryCount = attempt + 1;
      await wait(RETRY_DELAYS_MS[attempt]);
      return httpClient.request(config);
    }
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) unauthorizedHandler?.();
    return Promise.reject(toApiError(error));
  },
);
