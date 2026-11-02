import { useMutation } from '@tanstack/react-query';
import type { AuthSuccessResponse } from '@/types';
import { logout } from './authApi';

export function useLogoutMutation() {
  return useMutation<AuthSuccessResponse, Error, AbortSignal | undefined>({
    mutationFn: (signal) => logout(signal),
  });
}
