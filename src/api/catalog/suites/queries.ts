import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS, type SuitesListQuery } from '../queryKeys';
import { listSuites, getSuiteOptions, getSuite, type SuitesListResponse } from './requests';
import type { BenchmarkSuite, BenchmarkSuiteOption } from '@/types';

export interface UseSuiteQueryOptions {
  id?: string;
  enabled?: boolean;
}

export function useSuitesQuery(query: SuitesListQuery) {
  return useQuery<SuitesListResponse>({
    queryKey: CATALOG_QUERY_KEYS.suiteList(query),
    queryFn: () => listSuites(query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

/** Опции для пикеров категорий. Меняются редко — кешируем длиннее. */
export function useSuiteOptionsQuery() {
  return useQuery<BenchmarkSuiteOption[]>({
    queryKey: CATALOG_QUERY_KEYS.suiteOptions(),
    queryFn: getSuiteOptions,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useSuiteQuery({ id, enabled = true }: UseSuiteQueryOptions) {
  const hasId = !!id;
  return useQuery<BenchmarkSuite>({
    queryKey: CATALOG_QUERY_KEYS.suiteDetail(id ?? ''),
    queryFn: () => getSuite(id!),
    enabled: enabled && hasId,
    retry: shouldRetry,
  });
}
