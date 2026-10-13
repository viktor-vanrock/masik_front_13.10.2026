import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import {
  getAnalyticsEvents,
  getAnalyticsOverview,
  getTopBenchmarks,
  getTopBenchmarkTests,
  trackBenchmarkView,
  trackCatalogEvent,
} from './requests';
import { ANALYTICS_EVENT_TYPES } from './types';

describe('analytics requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overview with date range', async () => {
    const response = { totalEvents: 4 };
    const get = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({ data: response } as never);
    const query = { from: '2026-07-01', to: '2026-07-16' };

    await expect(getAnalyticsOverview(query)).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith('/analytics/overview', { params: query });
  });

  it('loads both ranking endpoints', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: [] } as never)
      .mockResolvedValueOnce({ data: [] } as never);
    const query = { from: '2026-07-01', to: '2026-07-16', limit: 10 };

    await getTopBenchmarks(query);
    await getTopBenchmarkTests(query);

    expect(get).toHaveBeenNthCalledWith(1, '/analytics/benchmarks/views', { params: query });
    expect(get).toHaveBeenNthCalledWith(2, '/analytics/benchmark-tests/views', { params: query });
  });

  it('loads filtered events', async () => {
    const response = { data: [], total: 0 };
    const get = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({ data: response } as never);
    const query = {
      page: 1,
      limit: 10,
      type: ANALYTICS_EVENT_TYPES.catalogSearch,
    };

    await expect(getAnalyticsEvents(query)).resolves.toBe(response);
    expect(get).toHaveBeenCalledWith('/analytics/events', { params: query });
  });

  it('posts benchmark and catalogue tracking payloads', async () => {
    const created = { id: 'event-id' };
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ data: created } as never);
    const viewDto = {
      benchmarkId: 'suite-id',
      benchmarkTestId: 'test-id',
      sessionId: 'session-id',
    };
    const searchDto = {
      type: ANALYTICS_EVENT_TYPES.catalogSearch,
      search: 'reasoning',
      sessionId: 'session-id',
    };

    await expect(trackBenchmarkView(viewDto)).resolves.toBe(created);
    await expect(trackCatalogEvent(searchDto)).resolves.toBe(created);

    expect(post).toHaveBeenNthCalledWith(1, '/analytics/benchmark-views', viewDto);
    expect(post).toHaveBeenNthCalledWith(2, '/analytics/catalog-events', searchDto);
  });
});
