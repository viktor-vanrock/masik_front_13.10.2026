import type { MetricsListQuery } from '@/types';

export const METRICS_QUERY_KEYS = {
  all: ['metrics'] as const,
  definitions: () => [...METRICS_QUERY_KEYS.all, 'definitions'] as const,
  definitionList: (query: MetricsListQuery) =>
    [...METRICS_QUERY_KEYS.definitions(), query] as const,
  models: () => [...METRICS_QUERY_KEYS.all, 'models'] as const,
  results: () => [...METRICS_QUERY_KEYS.all, 'results'] as const,
  testResults: (testId: string, query: MetricsListQuery) =>
    [...METRICS_QUERY_KEYS.results(), testId, query] as const,
};
