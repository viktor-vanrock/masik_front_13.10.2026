import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { ANALYTICS_QUERY_KEYS } from './queryKeys';
import {
  getAnalyticsEvents,
  getAnalyticsOverview,
  getTopBenchmarks,
  getTopBenchmarkTests,
} from './requests';
import type {
  AnalyticsDateRangeQuery,
  AnalyticsEventsQuery,
  AnalyticsTopQuery,
} from './types';

const ANALYTICS_STALE_TIME = 30_000;

interface AnalyticsQueryOptions {
  enabled?: boolean;
}

export function useAnalyticsOverviewQuery(
  query: AnalyticsDateRangeQuery,
  { enabled = true }: AnalyticsQueryOptions = {},
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(query),
    queryFn: () => getAnalyticsOverview(query),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
    retry: shouldRetry,
  });
}

export function useTopBenchmarksQuery(
  query: AnalyticsTopQuery,
  { enabled = true }: AnalyticsQueryOptions = {},
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.topBenchmarks(query),
    queryFn: () => getTopBenchmarks(query),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
    retry: shouldRetry,
  });
}

export function useTopBenchmarkTestsQuery(
  query: AnalyticsTopQuery,
  { enabled = true }: AnalyticsQueryOptions = {},
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.topBenchmarkTests(query),
    queryFn: () => getTopBenchmarkTests(query),
    enabled,
    staleTime: ANALYTICS_STALE_TIME,
    retry: shouldRetry,
  });
}

export function useAnalyticsEventsQuery(
  query: AnalyticsEventsQuery,
  { enabled = true }: AnalyticsQueryOptions = {},
) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.events(query),
    queryFn: () => getAnalyticsEvents(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: ANALYTICS_STALE_TIME,
    retry: shouldRetry,
  });
}
