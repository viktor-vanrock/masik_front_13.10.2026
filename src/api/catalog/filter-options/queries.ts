import { useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import { getFilterOptions } from './requests';
import type { BenchmarkTestFilterOptions } from '@/types';

export function useFilterOptionsQuery() {
  return useQuery<BenchmarkTestFilterOptions>({
    queryKey: CATALOG_QUERY_KEYS.filterOptions(),
    queryFn: getFilterOptions,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}
