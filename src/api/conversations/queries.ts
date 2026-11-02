import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { getQueryClient } from '@/services/query';
import { CONVERSATIONS_QUERY_KEYS } from './queryKeys';
import { listConversations, listSidebarConversations, listArchivedConversations, getConversation } from './requests';
import type { ConversationDto, ConversationDetailDto } from './types';
import type { InfiniteData } from '@tanstack/react-query';
import type { ConversationSidebarPage, ArchivedConversationsPage } from './types';

export async function removeConversationFromCache(userId: string, id: string) {
  const client = getQueryClient();
  if (!client) return;
  const list = { queryKey: CONVERSATIONS_QUERY_KEYS.list(userId) };
  const detail = { queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId, id) };
  await Promise.all([client.cancelQueries(list), client.cancelQueries(detail)]);
  client.removeQueries(detail);
  client.setQueryData<ConversationDto[]>(CONVERSATIONS_QUERY_KEYS.list(userId), previous => previous?.filter(item => item.id !== id));
  client.setQueryData<InfiniteData<ConversationSidebarPage>>(CONVERSATIONS_QUERY_KEYS.sidebar(userId), previous => {
    if (!previous) return previous;
    const removedHistory = previous.pages.some(page => page.data.some(item => item.id === id));
    return { ...previous, pages: previous.pages.map(page => ({ ...page, pinned: page.pinned.filter(item => item.id !== id),
      data: page.data.filter(item => item.id !== id), total: Math.max(0, page.total - Number(removedHistory)) })) };
  });
  client.setQueryData<InfiniteData<ArchivedConversationsPage>>(CONVERSATIONS_QUERY_KEYS.archive(userId), previous => {
    if (!previous) return previous;
    const removed = previous.pages.some(page => page.data.some(item => item.id === id));
    return { ...previous, pages: previous.pages.map(page => ({ ...page, data: page.data.filter(item => item.id !== id),
      total: Math.max(0, page.total - Number(removed)) })) };
  });
  void client.invalidateQueries(list);
}

interface QueryOptions {
  enabled?: boolean;
}

export async function refreshConversationDetail(userId: string, id: string) {
  const client = getQueryClient();
  if (!client) return;
  const filter = { queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId, id), exact: true };
  // Initial pending queries otherwise keep their old snapshot when invalidated.
  await client.cancelQueries(filter);
  await client.invalidateQueries(filter);
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

export function useSidebarConversationsQuery(userId: string | null, options: QueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEYS.sidebar(userId ?? ''),
    queryFn: ({ pageParam }) => listSidebarConversations(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasNextPage ? pages.length + 1 : undefined,
    enabled: !!userId && (options.enabled ?? true),
    retry: shouldRetry,
    staleTime: 30_000,
  });
}

export function useArchivedConversationsQuery(userId: string | null, options: QueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: CONVERSATIONS_QUERY_KEYS.archive(userId ?? ''),
    queryFn: ({ pageParam }) => listArchivedConversations(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.hasNextPage ? pages.length + 1 : undefined,
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
    staleTime: 0,
  });
}
