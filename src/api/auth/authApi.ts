import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import type { AuthSuccessResponse, LoginDto, RegisterDto } from '@/types';

export async function login(dto: LoginDto): Promise<AuthSuccessResponse> {
  // Неверные credentials → 401, но это ожидаемая form-ошибка, а не потеря живой сессии:
  // подавляем глобальное unauthorized-событие (ApiException всё равно бросается → loginError).
  const { data } = await httpClient.post<AuthSuccessResponse>(BACKEND_PATHS.auth.login, dto, {
    suppressUnauthorizedEvent: true,
  });
  return data;
}

export async function register(dto: RegisterDto): Promise<AuthSuccessResponse> {
  const { data } = await httpClient.post<AuthSuccessResponse>(BACKEND_PATHS.auth.register, dto, {
    suppressUnauthorizedEvent: true,
  });
  return data;
}

const LOGOUT_TIMEOUT_MS = 6000;

// Зависший бэкенд не должен блокировать logout навсегда: timeout — верхняя граница,
// signal — активная отмена (например, при более новом login, см. AuthProvider).
export async function logout(signal?: AbortSignal): Promise<AuthSuccessResponse> {
  const { data } = await httpClient.post<AuthSuccessResponse>(BACKEND_PATHS.auth.logout, {}, {
    timeout: LOGOUT_TIMEOUT_MS,
    signal,
  });
  return data;
}
