import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as authApi from './authApi';
import { useLoginMutation } from './useLoginMutation';
import { ApiException } from '@/services/http';

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { qc, wrapper };
}

describe('useLoginMutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('успешный логин: вызывает login() с переданным dto', async () => {
    const spy = vi
      .spyOn(authApi, 'login')
      .mockResolvedValueOnce({ success: true });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ username: 'alice', password: 'p' });
    });

    expect(spy).toHaveBeenCalledWith({ username: 'alice', password: 'p' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('пробрасывает ошибку API без модификации', async () => {
    const err = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    vi.spyOn(authApi, 'login').mockRejectedValueOnce(err);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ username: 'a', password: 'b' });
      } catch {
        /* ожидаем */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(err);
  });

  it('вызывает onSuccess, переданный на месте mutateAsync', async () => {
    vi
      .spyOn(authApi, 'login')
      .mockResolvedValueOnce({ success: true });
    const { wrapper } = makeWrapper();
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(
        { username: 'a', password: 'b' },
        { onSuccess }
      );
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0][0]).toEqual({ success: true });
  });
});
