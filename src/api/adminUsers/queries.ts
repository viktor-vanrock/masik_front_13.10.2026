import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import type { AdminUsersListQuery, AdminUsersListResponse } from '@/types';
import { ADMIN_USERS_QUERY_KEYS } from './queryKeys';
import { listAdminUsers } from './requests';

export function useAdminUsersQuery(query: AdminUsersListQuery) {
  return useQuery<AdminUsersListResponse>({
    queryKey: ADMIN_USERS_QUERY_KEYS.list(query),
    queryFn: () => listAdminUsers(query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}
