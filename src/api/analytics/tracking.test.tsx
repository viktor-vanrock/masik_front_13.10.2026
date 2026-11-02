import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BenchmarkTestListQuery } from '@/types';
import {
  getActiveCatalogFilters,
  getAnalyticsSessionId,
  useBenchmarkViewTracking,
  useCatalogAnalyticsTracking,
} from './tracking';
import { trackBenchmarkView, trackCatalogEvent } from './requests';
import { ANALYTICS_EVENT_TYPES } from './types';

vi.mock('./requests', () => ({
  trackBenchmarkView: vi.fn().mockResolvedValue({ id: 'view-event' }),
  trackCatalogEvent: vi.fn().mockResolvedValue({ id: 'catalog-event' }),
}));

const mockedTrackBenchmarkView = vi.mocked(trackBenchmarkView);
const mockedTrackCatalogEvent = vi.mocked(trackCatalogEvent);

describe('analytics tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('creates and reuses an anonymous session id', () => {
    const first = getAnalyticsSessionId();
    const second = getAnalyticsSessionId();

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it('extracts only active catalogue filters', () => {
    const query: BenchmarkTestListQuery = {
      search: 'math',
      page: 2,
      limit: 30,
      domainIds: ['domain-1'],
      languageIds: [],
      sizeMin: 100,
      sortDirection: 'ASC',
    };

    expect(getActiveCatalogFilters(query)).toEqual({
      domainIds: ['domain-1'],
      sizeMin: 100,
    });
  });

  it('tracks a benchmark card view and suppresses an immediate duplicate', async () => {
    const options = {
      benchmarkId: 'suite-id',
      benchmarkTestId: 'test-id',
    };

    const first = renderHook(() => useBenchmarkViewTracking(options));
    await act(async () => Promise.resolve());
    first.unmount();

    const second = renderHook(() => useBenchmarkViewTracking(options));
    await act(async () => Promise.resolve());
    second.unmount();

    expect(mockedTrackBenchmarkView).toHaveBeenCalledTimes(1);
    expect(mockedTrackBenchmarkView).toHaveBeenCalledWith(expect.objectContaining({
      benchmarkId: 'suite-id',
      benchmarkTestId: 'test-id',
      sessionId: expect.any(String),
    }));
  });

  it('debounces search and filter events', async () => {
    vi.useFakeTimers();
    const query: BenchmarkTestListQuery = {
      search: 'reasoning',
      domainIds: ['domain-1'],
    };

    renderHook(() => useCatalogAnalyticsTracking(query));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(mockedTrackCatalogEvent).toHaveBeenCalledTimes(2);
    expect(mockedTrackCatalogEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: ANALYTICS_EVENT_TYPES.catalogSearch,
      search: 'reasoning',
    }));
    expect(mockedTrackCatalogEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: ANALYTICS_EVENT_TYPES.filterUsage,
      filters: { domainIds: ['domain-1'] },
    }));
  });
});
