import { useEffect, useMemo, useRef } from 'react';
import type { BenchmarkTestListQuery } from '@/types';
import {
  ANALYTICS_EVENT_TYPES,
  type TrackBenchmarkViewDto,
  type TrackCatalogEventDto,
} from './types';
import { trackBenchmarkView, trackCatalogEvent } from './requests';

const SESSION_STORAGE_KEY = 'benchmark-catalog.analytics.session-id';
const VIEW_DEDUPE_PREFIX = 'benchmark-catalog.analytics.view';
const VIEW_DEDUPE_MS = 5_000;
const TRACKING_DEBOUNCE_MS = 600;

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnalyticsSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) return stored;

    const created = createSessionId();
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return undefined;
  }
}

async function trackBenchmarkViewBestEffort(
  dto: Omit<TrackBenchmarkViewDto, 'sessionId'>,
): Promise<void> {
  try {
    await trackBenchmarkView({
      ...dto,
      sessionId: getAnalyticsSessionId(),
    });
  } catch {
    // Analytics must never block or degrade the catalogue UX.
  }
}

async function trackCatalogEventBestEffort(
  dto: Omit<TrackCatalogEventDto, 'sessionId'>,
): Promise<void> {
  try {
    await trackCatalogEvent({
      ...dto,
      sessionId: getAnalyticsSessionId(),
    });
  } catch {
    // Analytics must never block or degrade the catalogue UX.
  }
}

export function getActiveCatalogFilters(
  query: BenchmarkTestListQuery,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if (
      key === 'search' ||
      key === 'page' ||
      key === 'limit' ||
      key === 'sortColumn' ||
      key === 'sortDirection'
    ) {
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      filters[key] = value;
      continue;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      filters[key] = value;
    }
  }

  return filters;
}

export interface BenchmarkViewTrackingOptions {
  benchmarkId?: string;
  benchmarkTestId?: string;
  enabled?: boolean;
}

export function useBenchmarkViewTracking({
  benchmarkId,
  benchmarkTestId,
  enabled = true,
}: BenchmarkViewTrackingOptions): void {
  useEffect(() => {
    if (!enabled || !benchmarkId) return;

    const viewId = benchmarkTestId ?? benchmarkId;
    const storageKey = `${VIEW_DEDUPE_PREFIX}:${viewId}`;
    const now = Date.now();

    try {
      const previous = Number(window.sessionStorage.getItem(storageKey));
      if (Number.isFinite(previous) && now - previous < VIEW_DEDUPE_MS) return;
      window.sessionStorage.setItem(storageKey, String(now));
    } catch {
      // sessionStorage may be unavailable; event tracking can still proceed.
    }

    void trackBenchmarkViewBestEffort({
      benchmarkId,
      benchmarkTestId,
      metadata: {
        page: 'benchmark-detail',
        source: 'catalogue',
      },
    });
  }, [benchmarkId, benchmarkTestId, enabled]);
}

export function useCatalogAnalyticsTracking(
  query: BenchmarkTestListQuery,
): void {
  const search = query.search?.trim() ?? '';
  const filters = useMemo(() => getActiveCatalogFilters(query), [query]);
  const filterSignature = useMemo(() => JSON.stringify(filters), [filters]);
  const lastSearchRef = useRef<string | undefined>(undefined);
  const lastFilterSignatureRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (search.length < 2 || lastSearchRef.current === search) return;

    const timeoutId = window.setTimeout(() => {
      lastSearchRef.current = search;
      void trackCatalogEventBestEffort({
        type: ANALYTICS_EVENT_TYPES.catalogSearch,
        search,
        metadata: { page: 'catalogue' },
      });
    }, TRACKING_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (
      Object.keys(filters).length === 0 ||
      lastFilterSignatureRef.current === filterSignature
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastFilterSignatureRef.current = filterSignature;
      void trackCatalogEventBestEffort({
        type: ANALYTICS_EVENT_TYPES.filterUsage,
        filters,
        metadata: { page: 'catalogue' },
      });
    }, TRACKING_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filterSignature, filters]);
}
