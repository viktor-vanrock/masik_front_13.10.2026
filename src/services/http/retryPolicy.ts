import { ApiException } from './errors';

/**
 * HTTP-статусы, на которые автоматический retry **не имеет смысла**:
 *  - 400 (валидация): повтор того же запроса даст ту же ошибку валидации.
 *  - 401 (нет токена): нужен re-login, не retry. Interceptor уже эмитит unauthorized-событие.
 *  - 403 (нет прав): роль не изменится между ретраями.
 *  - 404 (не найдено): сущности всё ещё нет.
 *
 * 5xx и сетевые ошибки (NetworkError, timeouts) — РЕТРАИМ (потенциально транзиентные).
 * 429 (rate limit) сейчас НЕ в этом списке: спорный кейс, обсудим если столкнёмся.
 */
export const NON_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([400, 401, 403, 404]);

export interface ShouldRetryOptions {
  /** Максимальное число попыток ПОСЛЕ первоначального вызова. По умолчанию 1. */
  maxRetries?: number;
}

/**
 * Универсальная retry-политика для TanStack Query (queries и mutations).
 *
 * Использование:
 *   useQuery({ ..., retry: shouldRetry });
 *   useMutation({ ..., retry: shouldRetry });
 *
 * С переопределением числа попыток:
 *   useQuery({ ..., retry: (count, err) => shouldRetry(count, err, { maxRetries: 3 }) });
 *
 * Возвращает `false` (не ретраить):
 *  - на ApiException с кодом из NON_RETRYABLE_STATUSES;
 *  - когда failureCount >= maxRetries.
 *
 * Иначе — `true`.
 *
 * Гравитационный сдвиг (Q-L): функция намеренно простая, чтобы её не пытались
 * использовать там, где политика реально другая (например, polling с 5 ретраями
 * или критическая мутация с 0 ретраев — лучше написать inline).
 */
export function shouldRetry(
  failureCount: number,
  error: unknown,
  options: ShouldRetryOptions = {},
): boolean {
  const { maxRetries = 1 } = options;

  if (error instanceof ApiException && NON_RETRYABLE_STATUSES.has(error.status)) {
    return false;
  }

  return failureCount < maxRetries;
}
