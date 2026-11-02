import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '@/services/http';
import { ApiException } from '@/services/http';
import { login, register } from './authApi';
import type { RegisterDto } from '@/types';

describe('authApi.login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('прокидывает ошибку из interceptor без модификации', async () => {
    const apiError = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(apiError);

    await expect(login({ username: 'a', password: 'b' })).rejects.toBe(apiError);
  });
});

describe('authApi.register', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('делает POST /auth/register с username, password и email', async () => {
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValueOnce({ data: { success: true } } as never);
    const dto: RegisterDto = {
      username: 'alice',
      password: 'secret',
      email: 'a@example.com',
    };

    await register(dto);

    expect(post).toHaveBeenCalledWith('/auth/register', dto, { suppressUnauthorizedEvent: true });
  });

  it('прокидывает ошибку валидации (400 с массивом message)', async () => {
    const apiError = new ApiException({
      statusCode: 400,
      message: ['username must be longer than 3 chars'],
    });
    vi.spyOn(httpClient, 'post').mockRejectedValueOnce(apiError);

    await expect(
      register({ username: 'a', password: 'b', email: 'c' })
    ).rejects.toBe(apiError);
  });
});
