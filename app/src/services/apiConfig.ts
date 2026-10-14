import Constants from 'expo-constants';

const API_PORT = 3333;
const API_PREFIX = '/api/v1';

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const resolveFromExpoHost = (): string | null => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:${API_PORT}${API_PREFIX}` : null;
};

export const resolveApiBaseUrl = (
  explicitUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): string => {
  if (explicitUrl && explicitUrl.trim().length > 0) return stripTrailingSlash(explicitUrl.trim());
  return resolveFromExpoHost() ?? `http://localhost:${API_PORT}${API_PREFIX}`;
};

export const API_BASE_URL = resolveApiBaseUrl();
