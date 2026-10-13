import { useMutation } from '@tanstack/react-query';
import type { AuthSuccessResponse, RegisterDto } from '@/types';
import { register } from './authApi';

export function useRegisterMutation() {
  return useMutation<AuthSuccessResponse, Error, RegisterDto>({
    mutationFn: (dto) => register(dto),
  });
}
