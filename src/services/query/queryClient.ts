// Фабрика QueryClient с дефолтами проекта: staleTime 30s, gcTime 5min,
// retry 1 для queries и 0 для mutations (действия не повторяем молча).

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
