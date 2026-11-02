import { useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import type { ExternalApiKey } from '@/types';
import { EXTERNAL_API_KEYS_QUERY_KEYS } from './queryKeys';
import { listExternalApiKeys, listExternalApiKeyScopes } from './requests';

export function useExternalApiKeysQuery() {
  return useQuery<ExternalApiKey[]>({
    queryKey: EXTERNAL_API_KEYS_QUERY_KEYS.list(),
    queryFn: listExternalApiKeys,
    retry: shouldRetry,
  });
}

export function useExternalApiKeyScopesQuery() {
  return useQuery<string[]>({
    queryKey: EXTERNAL_API_KEYS_QUERY_KEYS.scopes(),
    queryFn: listExternalApiKeyScopes,
    staleTime: 5 * 60_000,
    retry: shouldRetry,
  });
}
