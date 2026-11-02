import { useMutation } from '@tanstack/react-query';
import type { AuthSuccessResponse, LoginDto } from '@/types';
import { login } from './authApi';

export function useLoginMutation() {
  return useMutation<AuthSuccessResponse, Error, LoginDto>({
    // Явная обёртка: иначе TanStack Query v5 пробросит свой context
    // вторым аргументом — тесты и поведение начинают зависеть от внутренностей Query.
    mutationFn: (dto) => login(dto),
  });
}
