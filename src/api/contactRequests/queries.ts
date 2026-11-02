import { useInfiniteQuery } from '@tanstack/react-query';
import { httpClient, shouldRetry } from '@/services/http';
import type { ContactRequestItem } from '@/pages/Profile/ui/ContactRequestsSection';

interface ContactRequestsPage {
  data: ContactRequestItem[];
  nextCursor: string | null;
}

export function useContactRequests(userId: string | null, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['contactRequests', userId],
    enabled: enabled && !!userId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }): Promise<ContactRequestsPage> => {
      const { data } = await httpClient.get<ContactRequestsPage>('/contact-requests', {
        params: pageParam ? { cursor: pageParam } : {}, signal,
      });
      return data;
    },
    getNextPageParam: page => page.nextCursor ?? undefined,
    retry: shouldRetry,
    staleTime: 0,
  });
}
