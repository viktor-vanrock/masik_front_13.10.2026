import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { createHttpClient } from './axiosClient';
import { onUnauthorized } from '@/services/auth';
import { resetQueryClient, setQueryClient } from '@/services/query';
import { USERS_QUERY_KEYS } from '@/api/users/queryKeys';
import { ApiException, ForbiddenError, NetworkError } from './errors';

/**
 * Подмена axios-адаптера: возвращаем фиктивный ответ или фиктивную ошибку.
 * Никаких реальных запросов в jsdom.
 */
function mockAdapter(
  response:
    | { status: number; data: unknown }
    | { networkError: true; message?: string }
): AxiosAdapter {
  return (config) =>
    new Promise((resolve, reject) => {
      if ('networkError' in response) {
        const err = new Error(response.message ?? 'Network down') as Error & {
          isAxiosError?: boolean;
          config?: unknown;
          request?: unknown;
        };
        err.isAxiosError = true;
        err.config = config;
        err.request = {};
        reject(err);
        return;
      }
      const axiosResponse: AxiosResponse = {
        data: response.data,
        status: response.status,
        statusText: 'mock',
        headers: {},
        config,
      };
      if (response.status >= 200 && response.status < 300) {
        resolve(axiosResponse);
      } else {
        const err = new Error(`HTTP ${response.status}`) as Error & {
          isAxiosError?: boolean;
          config?: unknown;
          response?: AxiosResponse;
        };
        err.isAxiosError = true;
        err.config = config;
        err.response = axiosResponse;
        reject(err);
      }
    });
}

describe('axiosClient — response interceptor: 403', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetQueryClient();
  });

  it('бросает ForbiddenError и инвалидирует [profile]', async () => {
    const qc = new QueryClient();
    const invalidateSpy = vi
      .spyOn(qc, 'invalidateQueries')
      .mockResolvedValue(undefined);
    setQueryClient(qc);

    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({
      status: 403,
      data: { statusCode: 403, message: 'Forbidden' },
    });

    await expect(client.post('/benchmarks', {})).rejects.toBeInstanceOf(
      ForbiddenError
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: USERS_QUERY_KEYS.profile });
  });
});

describe('axiosClient — прочие ошибки', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetQueryClient();
  });

  it('400 с массивом сообщений бросает ApiException, payload сохраняется', async () => {
    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({
      status: 400,
      data: {
        statusCode: 400,
        message: ['username must be a string', 'password is too short'],
      },
    });

    try {
      await client.post('/auth/login', {});
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).status).toBe(400);
      expect((e as ApiException).payload.message).toEqual([
        'username must be a string',
        'password is too short',
      ]);
    }
  });

  it('500 с нестандартным телом получает fallback message', async () => {
    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({
      status: 500,
      data: '<html>broken</html>',
    });

    try {
      await client.get('/anything');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).status).toBe(500);
      expect(typeof (e as ApiException).payload.message).toBe('string');
    }
  });

  it('сетевая ошибка превращается в NetworkError', async () => {
    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({ networkError: true, message: 'ECONNREFUSED' });

    await expect(client.get('/anything')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('axiosClient — событие auth:unauthorized', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetQueryClient();
  });

  afterEach(() => {
    resetQueryClient();
  });

  it('обычный 401 эмитит событие и бросает ApiException', async () => {
    const handler = vi.fn();
    const unsubscribe = onUnauthorized(handler);

    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({
      status: 401,
      data: { statusCode: 401, message: 'Unauthorized' },
    });

    await expect(client.get('/conversations')).rejects.toBeInstanceOf(ApiException);
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('подписчик НЕ вызывается на 403', async () => {
    const handler = vi.fn();
    const unsubscribe = onUnauthorized(handler);

    const client = createHttpClient();
    client.defaults.adapter = mockAdapter({
      status: 403,
      data: { statusCode: 403, message: 'Forbidden' },
    });

    await expect(client.post('/benchmarks', {})).rejects.toBeInstanceOf(
      ForbiddenError
    );
    expect(handler).not.toHaveBeenCalled();

    unsubscribe();
  });
});
