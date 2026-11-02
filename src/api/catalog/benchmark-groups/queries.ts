import { useEffect } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import { getBenchmarkGroups } from './requests';
import type { BenchmarkTestListQuery } from '@/types';

export interface UseBenchmarkGroupsOptions {
  pageSize?: number;
  enabled?: boolean;
  loadAllPages?: boolean;
}

export function useBenchmarkGroupsQuery(
  query: BenchmarkTestListQuery,
  { pageSize = 30, enabled = true, loadAllPages = false }: UseBenchmarkGroupsOptions = {},
) {
  const result = useInfiniteQuery({
    enabled,
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

  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = result;
  useEffect(() => {
    if (enabled && loadAllPages && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [enabled, loadAllPages, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  return result;
}
