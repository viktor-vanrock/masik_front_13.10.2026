import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import type { User } from '@/types';

export async function getProfile(): Promise<User> {
  // suppressUnauthorizedEvent: bootstrap-запрос, его 401 = аноним, а не потеря сессии.
  const { data } = await httpClient.get<User>(BACKEND_PATHS.users.profile, {
    suppressUnauthorizedEvent: true,
  });
  return data;
}
