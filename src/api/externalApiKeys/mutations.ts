import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateExternalApiKeyDto, CreatedExternalApiKey } from '@/types';
import { EXTERNAL_API_KEYS_QUERY_KEYS } from './queryKeys';
import { createExternalApiKey, revokeExternalApiKey } from './requests';

export function useCreateExternalApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation<CreatedExternalApiKey, Error, CreateExternalApiKeyDto>({
    mutationFn: createExternalApiKey,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EXTERNAL_API_KEYS_QUERY_KEYS.list(),
      });
    },
  });
}

export function useRevokeExternalApiKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: revokeExternalApiKey,
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: EXTERNAL_API_KEYS_QUERY_KEYS.list(),
      });
    },
  });
}
