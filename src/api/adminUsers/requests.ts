import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';
import type {
  AdminUsersListQuery,
  AdminUsersListResponse,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  User,
} from '@/types';

export async function listAdminUsers(
  query: AdminUsersListQuery,
): Promise<AdminUsersListResponse> {
  const { data } = await httpClient.get<AdminUsersListResponse>(
    BACKEND_PATHS.users.list,
    { params: query },
  );
  return data;
}

export async function createAdminUser(dto: CreateAdminUserDto): Promise<User> {
  const { data } = await httpClient.post<User>(BACKEND_PATHS.users.list, dto);
  return data;
}

export async function updateAdminUser(
  id: string,
  dto: UpdateAdminUserDto,
): Promise<User> {
  const { data } = await httpClient.patch<User>(BACKEND_PATHS.users.detail(id), dto);
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await httpClient.delete(BACKEND_PATHS.users.detail(id));
}
