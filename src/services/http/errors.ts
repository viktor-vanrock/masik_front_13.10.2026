/**
 * Модель HTTP-ошибок (UI/мутации работают с этими классами, не зная про axios):
 * - `ApiException`  — нормализованная ошибка с payload бэка (NestJS HttpException);
 * - `ForbiddenError` — частный случай 403 (удобен для Guard'ов через instanceof);
 * - `NetworkError`  — нет ответа от сервера (offline/timeout).
 */

import type { ApiError } from '@/types';

export class ApiException extends Error {
  public readonly status: number;
  public readonly payload: ApiError;

  constructor(payload: ApiError) {
    super(extractMessage(payload));
    this.name = 'ApiException';
    this.status = payload.statusCode;
    this.payload = payload;
    // Восстанавливаем прототип после транспиляции `extends Error` — иначе
    // в некоторых таргетах ломается `instanceof`.
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

export class ForbiddenError extends ApiException {
  constructor(payload: ApiError) {
    super(payload);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.statusCode === 'number' &&
    (typeof v.message === 'string' || Array.isArray(v.message))
  );
}

/** Narrowed shape of the "delete blocked by usage" 409 envelope. */
export type UsageConflictPayload = ApiError & {
  statusCode: 409;
  usageCount: number;
};

/**
 * Type guard for the Settings dictionaries "delete blocked by usage" 409.
 */
export function isUsageConflictError(
  error: unknown,
): error is ApiException & { payload: UsageConflictPayload } {
  return (
    error instanceof ApiException &&
    error.status === 409 &&
    typeof error.payload.usageCount === 'number'
  );
}

export type SoftDeletedConflictPayload = ApiError & {
  statusCode: 409;
  code: 'SOFT_DELETED_ENTITY_EXISTS';
  deletedId: string;
};

export function isSoftDeletedConflict(
  error: unknown,
): error is ApiException & { payload: SoftDeletedConflictPayload } {
  return (
    error instanceof ApiException &&
    error.status === 409 &&
    error.payload.code === 'SOFT_DELETED_ENTITY_EXISTS' &&
    typeof error.payload.deletedId === 'string'
  );
}


export function isDuplicateConflictError(error: unknown): error is ApiException {
  return (
    error instanceof ApiException &&
    error.status === 409 &&
    !isUsageConflictError(error) &&
    !isSoftDeletedConflict(error)
  );
}

/**
 * Parse NestJS 400 validation messages into a field→message map.
 *
 * Handles two formats emitted by class-validator:
 *   "fieldName should not be empty"  → { fieldName: "should not be empty" }
 *   "fieldName: some message"        → { fieldName: "some message" }
 *
 * Messages that don't start with a known-field prefix are returned under
 * the `_general` key so callers can surface them as a banner.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiException) || error.status !== 400) return {};
  const messages = Array.isArray(error.payload.message)
    ? error.payload.message
    : [error.payload.message];
  const result: Record<string, string> = {};
  messages.forEach((msg) => {
    const m = msg.match(/^([a-zA-Z_][a-zA-Z0-9_]*)[:\s]\s*(.+)/);
    if (m) {
      result[m[1]] = result[m[1]] ? `${result[m[1]]}, ${m[2]}` : m[2];
    } else {
      result._general = result._general ? `${result._general}, ${msg}` : msg;
    }
  });
  return result;
}

/**
 * Привести произвольное тело ответа к ApiError.
 *
 * Поддерживает:
 *   1) полный NestJS-payload `{ statusCode, message, error? }` — возвращаем как есть;
 *   2) `{ message, error? }` без statusCode — берём http-status, message и error;
 *   3) что угодно ещё — fallback `{ statusCode: status, message: fallbackMessage }`.
 */
export function normalizeApiError(
  status: number,
  data: unknown,
  fallbackMessage: string
): ApiError {
  if (isApiError(data)) return data;

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    (typeof (data as { message: unknown }).message === 'string' ||
      Array.isArray((data as { message: unknown }).message))
  ) {
    const d = data as { message: string | string[]; error?: unknown };
    return {
      statusCode: status,
      message: d.message,
      ...(typeof d.error === 'string' ? { error: d.error } : {}),
    };
  }

  return { statusCode: status, message: fallbackMessage };
}

function extractMessage(payload: ApiError): string {
  if (Array.isArray(payload.message)) return payload.message[0] ?? 'API error';
  return payload.message ?? 'API error';
}

/**
 * Превратить серверную ошибку в строку для показа пользователю.
 *
 * - ApiException     → склеиваем payload.message (массив через ", ").
 * - Любой другой Error → берём .message.
 * - null / undefined / не-Error → null (нечего показывать).
 *
 * Не делает локализацию: тексты приходят с бэка как есть.
 */
export function formatServerErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiException) {
    const msg = error.payload.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  if (error instanceof Error) return error.message;
  return null;
}
