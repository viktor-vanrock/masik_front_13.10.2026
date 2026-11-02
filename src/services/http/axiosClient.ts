// Единый HTTP-клиент. Аутентификация — HttpOnly cookie (withCredentials), Authorization фронт не шлёт.
// Response-interceptor нормализует ошибки в ApiException / ForbiddenError / NetworkError.

import './httpAugment';
import axios, {
  AxiosError,
  type AxiosInstance,
} from 'axios';
import { emitUnauthorized } from '@/services/auth';
import { getQueryClient } from '@/services/query';
// Прямой импорт queryKeys (минуя barrel) — иначе цикл api → http → api.
import { USERS_QUERY_KEYS } from '@/api/users/queryKeys';
import {
  ApiException,
  ForbiddenError,
  NetworkError,
  normalizeApiError,
} from './errors';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Фабрика axios-инстанса. В тестах используйте её, а не singleton. */
export function createHttpClient(config: { baseURL?: string } = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL ?? baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => handleResponseError(error)
  );

  return instance;
}

function handleResponseError(error: unknown): never {
  if (!axios.isAxiosError(error)) throw error;

  const axiosError = error as AxiosError;

  if (!axiosError.response) {
    throw new NetworkError(axiosError.message);
  }

  const { status, data } = axiosError.response;
  const fallback = axiosError.message || `HTTP ${status}`;
  const apiError = normalizeApiError(status, data, fallback);

  if (status === 401) {
    // Bootstrap профиля (suppressUnauthorizedEvent): его 401 = аноним, не потеря сессии.
    if (!axiosError.config?.suppressUnauthorizedEvent) emitUnauthorized();
    throw new ApiException(apiError);
  }

  if (status === 403) {
    // Роль могла измениться — инвалидируем профиль, Guard перерендерится сам.
    getQueryClient()?.invalidateQueries({ queryKey: USERS_QUERY_KEYS.profile });
    throw new ForbiddenError(apiError);
  }

  throw new ApiException(apiError);
}

/** Singleton для приложения. В тестах используйте createHttpClient(). */
export const httpClient = createHttpClient();
