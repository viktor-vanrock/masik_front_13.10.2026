import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import {
  getMyCatalogSubmission,
  listMyCatalogSubmissions,
} from './requests';
import type {
  BenchmarkTestListResponse,
  BenchmarkType,
  CatalogSubmissionListQuery,
} from '@/types';

export function useMyCatalogSubmissionsQuery(
  query: CatalogSubmissionListQuery,
) {
  return useQuery<BenchmarkTestListResponse>({
    queryKey: CATALOG_QUERY_KEYS.mySubmissionList(query),
    queryFn: () => listMyCatalogSubmissions(query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

export function useMyCatalogSubmissionQuery({
  id,
  enabled = true,
}: {
  id?: string;
  enabled?: boolean;
}) {
  return useQuery<BenchmarkType>({
    queryKey: CATALOG_QUERY_KEYS.mySubmissionDetail(id ?? ''),
    queryFn: () => getMyCatalogSubmission(id!),
    enabled: enabled && Boolean(id),
    retry: shouldRetry,
  });
}
