import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';
import type {
  AnalyticsCreatedEvent,
  AnalyticsDateRangeQuery,
  AnalyticsEventsQuery,
  AnalyticsEventsResponse,
  AnalyticsOverview,
  AnalyticsTopQuery,
  BenchmarkTestViewsStat,
  BenchmarkViewsStat,
  TrackBenchmarkViewDto,
  TrackCatalogEventDto,
} from './types';

export async function getAnalyticsOverview(
  query: AnalyticsDateRangeQuery,
): Promise<AnalyticsOverview> {
  const { data } = await httpClient.get<AnalyticsOverview>(
    BACKEND_PATHS.analytics.overview,
    { params: query },
  );
  return data;
}

export async function getTopBenchmarks(
  query: AnalyticsTopQuery,
): Promise<BenchmarkViewsStat[]> {
  const { data } = await httpClient.get<BenchmarkViewsStat[]>(
    BACKEND_PATHS.analytics.benchmarkViews,
    { params: query },
  );
  return data;
}

export async function getTopBenchmarkTests(
  query: AnalyticsTopQuery,
): Promise<BenchmarkTestViewsStat[]> {
  const { data } = await httpClient.get<BenchmarkTestViewsStat[]>(
    BACKEND_PATHS.analytics.benchmarkTestViews,
    { params: query },
  );
  return data;
}

export async function getAnalyticsEvents(
  query: AnalyticsEventsQuery,
): Promise<AnalyticsEventsResponse> {
  const { data } = await httpClient.get<AnalyticsEventsResponse>(
    BACKEND_PATHS.analytics.events,
    { params: query },
  );
  return data;
}

export async function trackBenchmarkView(
  dto: TrackBenchmarkViewDto,
): Promise<AnalyticsCreatedEvent> {
  const { data } = await httpClient.post<AnalyticsCreatedEvent>(
    BACKEND_PATHS.analytics.trackBenchmarkView,
    dto,
  );
  return data;
}

export async function trackCatalogEvent(
  dto: TrackCatalogEventDto,
): Promise<AnalyticsCreatedEvent> {
  const { data } = await httpClient.post<AnalyticsCreatedEvent>(
    BACKEND_PATHS.analytics.trackCatalogEvent,
    dto,
  );
  return data;
}
