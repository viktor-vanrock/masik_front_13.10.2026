import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import { getBenchmarkGroups } from './requests';
import type { BenchmarkTestListQuery } from '@/types';

export interface UseBenchmarkGroupsOptions {
  pageSize?: number;
}

export function useBenchmarkGroupsQuery(
  query: BenchmarkTestListQuery,
  { pageSize = 30 }: UseBenchmarkGroupsOptions = {},
) {
  return useInfiniteQuery({
    queryKey: CATALOG_QUERY_KEYS.group(query),
    queryFn: ({ pageParam }) =>
      getBenchmarkGroups({ ...query, page: pageParam, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}
