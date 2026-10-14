import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === null;
  }
}

const isApiErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ApiErrorBody).error?.message === 'string';

const FALLBACK_BY_STATUS: Record<number, string> = {
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Registro não encontrado.',
  429: 'Muitas tentativas. Aguarde um instante e tente novamente.',
  500: 'O servidor encontrou um problema. Tente novamente mais tarde.',
};

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar à API do Library. Verifique sua conexão e o endereço da API.';

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (isAxiosError(error)) {
    if (!error.response) return new ApiError(NETWORK_ERROR_MESSAGE, null);
    const { status, data } = error.response;
    if (isApiErrorBody(data)) {
      const fieldErrors = Object.fromEntries(
        (data.error.details ?? []).map((detail) => [detail.field, detail.message]),
      );
      return new ApiError(data.error.message, status, fieldErrors);
    }
    return new ApiError(FALLBACK_BY_STATUS[status] ?? 'Erro inesperado.', status);
  }
  return new ApiError(error instanceof Error ? error.message : 'Erro inesperado.', null);
};

export const getErrorMessage = (error: unknown): string => toApiError(error).message;
