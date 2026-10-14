import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toApiError } from '../services/apiError';
import { authService, type LoginCredentials, type RegisterData } from '../services/authService';
import { setAuthToken, setUnauthorizedHandler } from '../services/httpClient';
import { tokenStorage } from '../services/tokenStorage';
import type { AuthResponse, User } from '../types/api';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const clearSession = useCallback(async (): Promise<void> => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await tokenStorage.clear();
  }, []);

  const startSession = useCallback(async (response: AuthResponse): Promise<void> => {
    setAuthToken(response.token);
    const profile = await authService.me();
    await tokenStorage.save(response.token);
    setSessionError(null);
    setToken(response.token);
    setUser(profile);
  }, []);

  const resumeWithToken = useCallback(
    async (storedToken: string | null): Promise<void> => {
      try {
        if (!storedToken) return;
        setAuthToken(storedToken);
        const profile = await authService.me();
        setToken(storedToken);
        setUser(profile);
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.isNetworkError) {
          setAuthToken(null);
          setSessionError(apiError.message);
        } else {
          await clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [clearSession],
  );

  const restoreSession = useCallback(
    async (): Promise<void> => resumeWithToken(await tokenStorage.read()),
    [resumeWithToken],
  );

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        await startSession(await authService.login(credentials));
      } catch (error) {
        await clearSession();
        throw error;
      }
    },
    [startSession, clearSession],
  );

  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      try {
        await startSession(await authService.register(data));
      } catch (error) {
        await clearSession();
        throw error;
      }
    },
    [startSession, clearSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout().catch(() => undefined);
    await clearSession();
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionError(SESSION_EXPIRED_MESSAGE);
      void clearSession();
    });
    void tokenStorage.read().then(resumeWithToken);
    return () => setUnauthorizedHandler(null);
  }, [clearSession, resumeWithToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      sessionError,
      login,
      register,
      logout,
      restoreSession,
      updateUser: setUser,
    }),
    [user, token, isLoading, sessionError, login, register, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
