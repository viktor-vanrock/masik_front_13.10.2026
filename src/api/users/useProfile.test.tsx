import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as usersApi from './usersApi';
import { useProfile } from './useProfile';
import { ApiException } from '@/services/http';
import { mockUser } from '@/test/mocks/user';

/** Wrapper с retry: false — для базовых тестов, где ретраи не нужны. */
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

/**
 * Wrapper без retry: false — чтобы логика retry-функции хука работала нетронутой.
 * retryDelay: 0 — мгновенные ретраи, не замедляют тесты.
 */
function makeRetryWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, staleTime: 0, retryDelay: 0 },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('загружает профиль через getProfile()', async () => {
    const user = mockUser({ username: 'alice', role: 'ADMIN' });
    vi.spyOn(usersApi, 'getProfile').mockResolvedValueOnce(user);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(user);
  });

  it('не запускает запрос при enabled=false', async () => {
    const spy = vi.spyOn(usersApi, 'getProfile');
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useProfile({ enabled: false }), { wrapper });

    // Даём микрозадачам прокрутиться.
    await new Promise((r) => setTimeout(r, 0));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('пробрасывает ApiException в error без ретраев', async () => {
    const err = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    vi.spyOn(usersApi, 'getProfile').mockRejectedValueOnce(err);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(err);
  });
});

describe('useProfile — retry policy (Block 3 / H-3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('не ретраит 401 — вызов getProfile ровно один раз', async () => {
    const err = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    const spy = vi.spyOn(usersApi, 'getProfile').mockRejectedValue(err);
    const { wrapper } = makeRetryWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('не ретраит 403 — вызов getProfile ровно один раз', async () => {
    const err = new ApiException({ statusCode: 403, message: 'Forbidden' });
    const spy = vi.spyOn(usersApi, 'getProfile').mockRejectedValue(err);
    const { wrapper } = makeRetryWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ретраит 500 ровно один раз (два вызова, оба падают → isError)', async () => {
    const err = new ApiException({ statusCode: 500, message: 'Internal Server Error' });
    // mockRejectedValue (не Once) — все вызовы падают, не важно сколько их.
    const spy = vi.spyOn(usersApi, 'getProfile').mockRejectedValue(err);
    const { wrapper } = makeRetryWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // failureCount 0 → retry; failureCount 1 → stop → итого 2 вызова
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ретраит сетевую ошибку и возвращает данные при успехе второго вызова', async () => {
    const user = mockUser();
    const spy = vi
      .spyOn(usersApi, 'getProfile')
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce(user);
    const { wrapper } = makeRetryWrapper();

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(user);
  });
});
