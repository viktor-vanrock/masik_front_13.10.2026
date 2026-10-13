import { describe, expect, it } from 'vitest';
import { ANALYTICS_EVENT_TYPES } from '@/api/analytics';
import {
  buildAnalyticsChartData,
  formatDateInput,
  getDateRange,
  shortHash,
} from './utils';

describe('analytics dashboard utils', () => {
  it('builds an inclusive date range', () => {
    expect(getDateRange(7, new Date(2026, 6, 16, 12))).toEqual({
      from: '2026-07-10',
      to: '2026-07-16',
    });
    expect(formatDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('fills missing days and aggregates event types', () => {
    const rows = buildAnalyticsChartData(
      [
        {
          date: '2026-07-15',
          type: ANALYTICS_EVENT_TYPES.benchmarkTestView,
          count: 3,
        },
        {
          date: '2026-07-15',
          type: ANALYTICS_EVENT_TYPES.catalogSearch,
          count: 2,
        },
      ],
      '2026-07-14',
      '2026-07-16',
    );

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ date: '2026-07-14', total: 0 });
    expect(rows[1]).toMatchObject({
      date: '2026-07-15',
      benchmarkTestViews: 3,
      catalogSearches: 2,
      total: 5,
    });
  });

  it('shortens hashes for the event table', () => {
    expect(shortHash(null)).toBe('—');
    expect(shortHash('1234567890123456')).toBe('123456789012…');
  });
});
