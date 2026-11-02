import type { AdminUsersListQuery } from '@/types';

export const ADMIN_USERS_QUERY_KEYS = {
  all: ['admin-users'] as const,
  lists: () => [...ADMIN_USERS_QUERY_KEYS.all, 'list'] as const,
  list: (query: AdminUsersListQuery) =>
    [...ADMIN_USERS_QUERY_KEYS.lists(), query] as const,
};
