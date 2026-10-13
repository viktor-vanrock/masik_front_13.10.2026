import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '@/services/http';
import { ApiException } from '@/services/http';
import { getProfile } from './usersApi';
import type { User } from '@/types';

describe('usersApi.getProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('делает GET /users/profile как bootstrap-запрос (suppressUnauthorizedEvent)', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: { id: '1', username: 'a', role: 'USER' } } as never);

    await getProfile();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/users/profile', { suppressUnauthorizedEvent: true });
  });

  it('возвращает тело ответа как есть', async () => {
    const user: User = {
      id: '42',
      username: 'alice',
      role: 'ADMIN',
      email: 'alice@example.com',
    };
    vi.spyOn(httpClient, 'get').mockResolvedValueOnce({ data: user } as never);

    const result = await getProfile();

    expect(result).toEqual(user);
  });

  it('прокидывает 401 из interceptor', async () => {
    const apiError = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    vi.spyOn(httpClient, 'get').mockRejectedValueOnce(apiError);

    await expect(getProfile()).rejects.toBe(apiError);
  });
});
