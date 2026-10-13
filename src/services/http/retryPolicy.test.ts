import { describe, expect, it } from 'vitest';
import { shouldRetry, NON_RETRYABLE_STATUSES } from './retryPolicy';
import { ApiException, NetworkError } from './errors';

function apiError(status: number): ApiException {
  return new ApiException({ statusCode: status, message: 'err', error: 'Test' });
}

describe('shouldRetry — non-retryable HTTP-статусы', () => {
  it('400 (валидация) → не ретраить', () => {
    expect(shouldRetry(0, apiError(400))).toBe(false);
  });

  it('401 (нет токена) → не ретраить', () => {
    expect(shouldRetry(0, apiError(401))).toBe(false);
  });

  it('403 (нет прав) → не ретраить', () => {
    expect(shouldRetry(0, apiError(403))).toBe(false);
  });

  it('404 (не найдено) → не ретраить', () => {
    expect(shouldRetry(0, apiError(404))).toBe(false);
  });

  it('non-retryable перебивает failureCount (даже если failureCount=0, всё равно false)', () => {
    expect(shouldRetry(0, apiError(400))).toBe(false);
    expect(shouldRetry(99, apiError(400))).toBe(false);
  });
});

describe('shouldRetry — retryable ошибки', () => {
  it('5xx ретраит, пока failureCount < maxRetries', () => {
    expect(shouldRetry(0, apiError(500))).toBe(true);
    expect(shouldRetry(0, apiError(502))).toBe(true);
    expect(shouldRetry(0, apiError(503))).toBe(true);
    expect(shouldRetry(0, apiError(504))).toBe(true);
  });

  it('NetworkError ретраит', () => {
    expect(shouldRetry(0, new NetworkError())).toBe(true);
  });

  it('неизвестная Error ретраит (по умолчанию)', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(true);
  });

  it('не-Error значение (string/null/undefined) ретраит', () => {
    expect(shouldRetry(0, 'string error')).toBe(true);
    expect(shouldRetry(0, null)).toBe(true);
    expect(shouldRetry(0, undefined)).toBe(true);
  });

  it('429 (rate limit) сейчас ретраит — это сознательное решение, см. JSDoc', () => {
    expect(shouldRetry(0, apiError(429))).toBe(true);
  });
});

describe('shouldRetry — лимит попыток', () => {
  it('по умолчанию maxRetries=1: failureCount 0 → true, 1 → false', () => {
    expect(shouldRetry(0, apiError(500))).toBe(true);
    expect(shouldRetry(1, apiError(500))).toBe(false);
  });

  it('maxRetries=3: 0,1,2 → true, 3 → false', () => {
    expect(shouldRetry(0, apiError(500), { maxRetries: 3 })).toBe(true);
    expect(shouldRetry(1, apiError(500), { maxRetries: 3 })).toBe(true);
    expect(shouldRetry(2, apiError(500), { maxRetries: 3 })).toBe(true);
    expect(shouldRetry(3, apiError(500), { maxRetries: 3 })).toBe(false);
  });

  it('maxRetries=0: даже на первой ошибке не ретраит', () => {
    expect(shouldRetry(0, apiError(500), { maxRetries: 0 })).toBe(false);
    expect(shouldRetry(0, new NetworkError(), { maxRetries: 0 })).toBe(false);
  });

  it('non-retryable перебивает maxRetries (даже с maxRetries=99 — false)', () => {
    expect(shouldRetry(0, apiError(401), { maxRetries: 99 })).toBe(false);
  });
});

describe('NON_RETRYABLE_STATUSES — состав константы', () => {
  it('содержит ровно [400, 401, 403, 404]', () => {
    expect(NON_RETRYABLE_STATUSES.size).toBe(4);
    expect(NON_RETRYABLE_STATUSES.has(400)).toBe(true);
    expect(NON_RETRYABLE_STATUSES.has(401)).toBe(true);
    expect(NON_RETRYABLE_STATUSES.has(403)).toBe(true);
    expect(NON_RETRYABLE_STATUSES.has(404)).toBe(true);
  });

  it('не содержит 5xx и 429 (они retryable)', () => {
    expect(NON_RETRYABLE_STATUSES.has(429)).toBe(false);
    expect(NON_RETRYABLE_STATUSES.has(500)).toBe(false);
    expect(NON_RETRYABLE_STATUSES.has(502)).toBe(false);
    expect(NON_RETRYABLE_STATUSES.has(503)).toBe(false);
  });
});

describe('shouldRetry — pure function', () => {
  it('детерминирована: одни входы → один выход', () => {
    const e = apiError(500);
    expect(shouldRetry(0, e)).toBe(shouldRetry(0, e));
    expect(shouldRetry(1, e)).toBe(shouldRetry(1, e));
  });

  it('не мутирует error и не имеет сайд-эффектов (smoke)', () => {
    const e = apiError(500);
    const payloadBefore = { ...e.payload };
    shouldRetry(0, e);
    expect(e.payload).toEqual(payloadBefore);
  });
});
