import { useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import type {
  MetricModel,
  MetricResultsResponse,
  MetricsListQuery,
  MetricsListResponse,
} from '@/types';
import { METRICS_QUERY_KEYS } from './queryKeys';
import {
  listMetricDefinitions,
  listMetricModels,
  listMetricResults,
} from './requests';

export function useMetricDefinitionsQuery(
  query: MetricsListQuery = { limit: 1000 },
) {
  return useQuery<MetricsListResponse>({
    queryKey: METRICS_QUERY_KEYS.definitionList(query),
    queryFn: () => listMetricDefinitions(query),
    retry: shouldRetry,
  });
}

export function useMetricModelsQuery() {
  return useQuery<MetricModel[]>({
    queryKey: METRICS_QUERY_KEYS.models(),
    queryFn: listMetricModels,
    retry: shouldRetry,
  });
}

export function useMetricResultsQuery(
  testId?: string,
  query: MetricsListQuery = { limit: 1000 },
) {
  return useQuery<MetricResultsResponse>({
    queryKey: METRICS_QUERY_KEYS.testResults(testId ?? '', query),
    queryFn: () => listMetricResults(testId!, query),
    enabled: Boolean(testId),
    retry: shouldRetry,
  });
}
