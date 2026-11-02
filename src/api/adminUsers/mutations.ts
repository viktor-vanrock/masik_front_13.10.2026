import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateAdminUserDto, UpdateAdminUserDto, User } from '@/types';
import { ADMIN_USERS_QUERY_KEYS } from './queryKeys';
import { createAdminUser, deleteAdminUser, updateAdminUser } from './requests';

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, CreateAdminUserDto>({
    mutationFn: createAdminUser,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEYS.lists() });
    },
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; dto: UpdateAdminUserDto }>({
    mutationFn: ({ id, dto }) => updateAdminUser(id, dto),
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteAdminUser,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEYS.lists() });
    },
  });
}
