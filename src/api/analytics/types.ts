export const ANALYTICS_EVENT_TYPES = {
  benchmarkView: 'benchmark_view',
  benchmarkTestView: 'benchmark_test_view',
  catalogSearch: 'catalog_search',
  filterUsage: 'filter_usage',
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES];

export interface AnalyticsDateRangeQuery {
  from?: string;
  to?: string;
}

export interface AnalyticsTopQuery extends AnalyticsDateRangeQuery {
  limit?: number;
}

export interface AnalyticsEventsQuery extends AnalyticsDateRangeQuery {
  page?: number;
  limit?: number;
  type?: AnalyticsEventType;
  benchmarkId?: string;
  benchmarkTestId?: string;
}

export interface AnalyticsCreatedEvent {
  id: string;
  type: AnalyticsEventType;
  benchmarkId: string | null;
  benchmarkTestId: string | null;
  createdAt: string;
}

export interface TrackBenchmarkViewDto {
  benchmarkId: string;
  benchmarkTestId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackCatalogEventDto {
  type:
    | typeof ANALYTICS_EVENT_TYPES.catalogSearch
    | typeof ANALYTICS_EVENT_TYPES.filterUsage;
  search?: string;
  filters?: Record<string, unknown>;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsCounterByDay {
  date: string;
  type: AnalyticsEventType;
  count: number;
}

export interface BenchmarkViewsStat {
  benchmarkId: string;
  name: string | null;
  nameEn: string | null;
  views: number;
}

export interface BenchmarkTestViewsStat {
  benchmarkTestId: string;
  benchmarkId: string | null;
  name: string | null;
  nameEn: string | null;
  benchmarkName: string | null;
  benchmarkNameEn: string | null;
  views: number;
}

export interface AnalyticsOverview {
  period: {
    from: string;
    to: string;
  };
  totalEvents: number;
  totalViews: number;
  benchmarkViews: number;
  benchmarkTestViews: number;
  catalogSearches: number;
  filterUsageEvents: number;
  uniqueSessions: number;
  topBenchmarks: BenchmarkViewsStat[];
  topBenchmarkTests: BenchmarkTestViewsStat[];
  eventsByDay: AnalyticsCounterByDay[];
}

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  benchmarkId: string | null;
  benchmarkTestId: string | null;
  userId: string | null;
  sessionIdHash: string | null;
  ipHash: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  eventDate: string;
  createdAt: string;
  benchmark: {
    id: string;
    name: string;
    nameEn: string;
  } | null;
  benchmarkTest: {
    id: string;
    name: string;
    nameEn: string;
    benchmarkId: string;
  } | null;
}

export interface AnalyticsEventsResponse {
  data: AnalyticsEvent[];
  total: number;
}
