import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import {
  getBenchmark,
  getBenchmarkForManagement,
  listBenchmarks,
  listBenchmarksForManagement,
} from './requests';
import type {
  BenchmarkTestListQuery,
  BenchmarkTestListResponse,
  BenchmarkType,
} from '@/types';

export interface UseBenchmarkQueryOptions {
  id?: string;
  enabled?: boolean;
}

export function useBenchmarksQuery(query: BenchmarkTestListQuery, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<BenchmarkTestListResponse>({
    enabled,
    queryKey: CATALOG_QUERY_KEYS.list(query),
    queryFn: () => listBenchmarks(query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

export function useBenchmarkQuery({
  id,
  enabled = true,
}: UseBenchmarkQueryOptions) {
  const hasId = !!id;
  return useQuery<BenchmarkType>({
    queryKey: CATALOG_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => getBenchmark(id!),
    enabled: enabled && hasId,
    retry: shouldRetry,
  });
}

export function useManagementBenchmarksQuery(query: BenchmarkTestListQuery) {
  return useQuery<BenchmarkTestListResponse>({
    queryKey: CATALOG_QUERY_KEYS.managementList(query),
    queryFn: () => listBenchmarksForManagement(query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

export function useManagementBenchmarkQuery({
  id,
  enabled = true,
}: UseBenchmarkQueryOptions) {
  const hasId = !!id;
  return useQuery<BenchmarkType>({
    queryKey: CATALOG_QUERY_KEYS.managementDetail(id ?? ''),
    queryFn: () => getBenchmarkForManagement(id!),
    enabled: enabled && hasId,
    retry: shouldRetry,
  });
}
