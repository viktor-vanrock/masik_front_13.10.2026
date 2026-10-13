import { useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CONVERSATIONS_QUERY_KEYS } from './queryKeys';
import { listConversations, getConversation } from './requests';
import type { ConversationDto, ConversationDetailDto } from './types';

interface QueryOptions {
  enabled?: boolean;
}

export function useConversationsQuery(userId: string | null, options: QueryOptions = {}) {
  return useQuery<ConversationDto[]>({
    queryKey: CONVERSATIONS_QUERY_KEYS.list(userId ?? ''),
    queryFn: listConversations,
    enabled: !!userId && (options.enabled ?? true),
    retry: shouldRetry,
    staleTime: 30_000,
  });
}

export function useConversationDetailQuery(
  id: string | null | undefined,
  userId: string | null,
  options: QueryOptions = {},
) {
  const hasId = !!id;
  return useQuery<ConversationDetailDto>({
    queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId ?? '', id ?? ''),
    queryFn: () => getConversation(id!),
    enabled: !!userId && (options.enabled ?? true) && hasId,
    retry: shouldRetry,
    staleTime: 10_000,
  });
}
