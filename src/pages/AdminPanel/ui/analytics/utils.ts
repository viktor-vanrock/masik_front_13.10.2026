import {
  ANALYTICS_EVENT_TYPES,
  type AnalyticsCounterByDay,
  type AnalyticsEventType,
} from '@/api/analytics';

export interface AnalyticsChartRow {
  date: string;
  benchmarkViews: number;
  benchmarkTestViews: number;
  catalogSearches: number;
  filterUsageEvents: number;
  total: number;
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(days: number, now = new Date()): {
  from: string;
  to: string;
} {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - Math.max(days - 1, 0));

  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  };
}

function createEmptyRow(date: string): AnalyticsChartRow {
  return {
    date,
    benchmarkViews: 0,
    benchmarkTestViews: 0,
    catalogSearches: 0,
    filterUsageEvents: 0,
    total: 0,
  };
}

function assignCount(
  row: AnalyticsChartRow,
  type: AnalyticsEventType,
  count: number,
): void {
  switch (type) {
  case ANALYTICS_EVENT_TYPES.benchmarkView:
    row.benchmarkViews += count;
    break;
  case ANALYTICS_EVENT_TYPES.benchmarkTestView:
    row.benchmarkTestViews += count;
    break;
  case ANALYTICS_EVENT_TYPES.catalogSearch:
    row.catalogSearches += count;
    break;
  case ANALYTICS_EVENT_TYPES.filterUsage:
    row.filterUsageEvents += count;
    break;
  }
  row.total += count;
}

export function buildAnalyticsChartData(
  events: AnalyticsCounterByDay[],
  from: string,
  to: string,
): AnalyticsChartRow[] {
  const rows = new Map<string, AnalyticsChartRow>();
  const current = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime()) || current > end) {
    return [];
  }

  while (current <= end) {
    const date = formatDateInput(current);
    rows.set(date, createEmptyRow(date));
    current.setDate(current.getDate() + 1);
  }

  for (const event of events) {
    const row = rows.get(event.date) ?? createEmptyRow(event.date);
    assignCount(row, event.type, event.count);
    rows.set(event.date, row);
  }

  return Array.from(rows.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
}

export function shortHash(value: string | null): string {
  if (!value) return '—';
  return value.length > 12 ? `${value.slice(0, 12)}…` : value;
}
