import type {
  AnalyticsDateRangeQuery,
  AnalyticsEventsQuery,
  AnalyticsTopQuery,
} from './types';

function normalize<T extends object>(query: T): T {
  const entries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries) as T;
}

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  overview: (query: AnalyticsDateRangeQuery) =>
    [...ANALYTICS_QUERY_KEYS.all, 'overview', normalize(query)] as const,
  topBenchmarks: (query: AnalyticsTopQuery) =>
    [...ANALYTICS_QUERY_KEYS.all, 'top-benchmarks', normalize(query)] as const,
  topBenchmarkTests: (query: AnalyticsTopQuery) =>
    [...ANALYTICS_QUERY_KEYS.all, 'top-benchmark-tests', normalize(query)] as const,
  events: (query: AnalyticsEventsQuery) =>
    [...ANALYTICS_QUERY_KEYS.all, 'events', normalize(query)] as const,
} as const;
