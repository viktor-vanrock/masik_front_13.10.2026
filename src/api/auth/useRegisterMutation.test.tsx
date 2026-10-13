import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import * as authApi from './authApi';
import { useRegisterMutation } from './useRegisterMutation';
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

describe('useRegisterMutation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('успешная регистрация: вызывает register() с username/password/email', async () => {
    const spy = vi
      .spyOn(authApi, 'register')
      .mockResolvedValueOnce({ success: true });
    const { wrapper } = makeWrapper();
    const dto = { username: 'bob', password: 'p', email: 'b@b.com' };

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(dto);
    });

    expect(spy).toHaveBeenCalledWith(dto);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('пробрасывает 400 validation-ошибку без модификации', async () => {
    const err = new ApiException({
      statusCode: 400,
      message: ['username too short'],
    });
    vi.spyOn(authApi, 'register').mockRejectedValueOnce(err);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({ username: 'a', password: 'b', email: 'c' });
      } catch {
        /* ожидаем */
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(err);
  });
});
