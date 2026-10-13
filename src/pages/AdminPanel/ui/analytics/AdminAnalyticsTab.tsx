import { useMemo, useState } from 'react';
import {
  Eye,
  Filter,
  Layers,
  LayoutGrid,
  Search,
  Users,
} from 'lucide-react';
import {
  useAnalyticsEventsQuery,
  useAnalyticsOverviewQuery,
  useTopBenchmarksQuery,
  useTopBenchmarkTestsQuery,
  type AnalyticsEventType,
} from '@/api/analytics';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';
import { AnalyticsActivityChart } from './AnalyticsActivityChart';
import { AnalyticsDateRange } from './AnalyticsDateRange';
import { AnalyticsEventsTable } from './AnalyticsEventsTable';
import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import {
  AnalyticsRankingTable,
  type AnalyticsRankingItem,
} from './AnalyticsRankingTable';
import { buildAnalyticsChartData, getDateRange } from './utils';

const DEFAULT_PRESET_DAYS = 30;
const TOP_LIMIT = 10;
const EVENTS_LIMIT = 10;

export function AdminAnalyticsTab() {
  const { t, lang } = useApp();
  const initialRange = useMemo(() => getDateRange(DEFAULT_PRESET_DAYS), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [activePreset, setActivePreset] = useState<number | null>(DEFAULT_PRESET_DAYS);
  const [eventType, setEventType] = useState<AnalyticsEventType | ''>('');

  const isRangeValid = Boolean(from && to && from <= to);
  const dateQuery = useMemo(() => ({ from, to }), [from, to]);
  const topQuery = useMemo(
    () => ({ ...dateQuery, limit: TOP_LIMIT }),
    [dateQuery],
  );
  const eventsQuery = useMemo(
    () => ({
      ...dateQuery,
      page: 1,
      limit: EVENTS_LIMIT,
      type: eventType || undefined,
    }),
    [dateQuery, eventType],
  );

  const overviewQuery = useAnalyticsOverviewQuery(dateQuery, { enabled: isRangeValid });
  const topBenchmarksQuery = useTopBenchmarksQuery(topQuery, { enabled: isRangeValid });
  const topBenchmarkTestsQuery = useTopBenchmarkTestsQuery(topQuery, { enabled: isRangeValid });
  const eventsResultQuery = useAnalyticsEventsQuery(eventsQuery, { enabled: isRangeValid });

  const overview = overviewQuery.data;
  const isRefreshing = [
    overviewQuery,
    topBenchmarksQuery,
    topBenchmarkTestsQuery,
    eventsResultQuery,
  ].some((query) => query.isFetching);
  const isError = [
    overviewQuery,
    topBenchmarksQuery,
    topBenchmarkTestsQuery,
    eventsResultQuery,
  ].some((query) => query.isError);

  const chartData = useMemo(
    () => buildAnalyticsChartData(overview?.eventsByDay ?? [], from, to),
    [overview?.eventsByDay, from, to],
  );

  const topBenchmarks = useMemo<AnalyticsRankingItem[]>(
    () => (topBenchmarksQuery.data ?? []).map((item) => ({
      id: item.benchmarkId,
      name: lang === 'en'
        ? item.nameEn || item.name || item.benchmarkId
        : item.name || item.nameEn || item.benchmarkId,
      views: item.views,
    })),
    [topBenchmarksQuery.data, lang],
  );

  const topBenchmarkTests = useMemo<AnalyticsRankingItem[]>(
    () => (topBenchmarkTestsQuery.data ?? []).map((item) => ({
      id: item.benchmarkTestId,
      name: lang === 'en'
        ? item.nameEn || item.name || item.benchmarkTestId
        : item.name || item.nameEn || item.benchmarkTestId,
      subtitle: lang === 'en'
        ? item.benchmarkNameEn || item.benchmarkName || undefined
        : item.benchmarkName || item.benchmarkNameEn || undefined,
      views: item.views,
      href: ROUTES.BENCHMARK(item.benchmarkTestId),
    })),
    [topBenchmarkTestsQuery.data, lang],
  );

  const applyPreset = (days: number) => {
    const range = getDateRange(days);
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(days);
  };

  const refresh = () => {
    if (!isRangeValid) return;
    void Promise.all([
      overviewQuery.refetch(),
      topBenchmarksQuery.refetch(),
      topBenchmarkTestsQuery.refetch(),
      eventsResultQuery.refetch(),
    ]);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t.admin.analytics.title}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {t.admin.analytics.subtitle}
        </p>
      </div>

      <AnalyticsDateRange
        from={from}
        to={to}
        activePreset={activePreset}
        isRefreshing={isRefreshing}
        onPresetChange={applyPreset}
        onFromChange={(value) => {
          setFrom(value);
          setActivePreset(null);
        }}
        onToChange={(value) => {
          setTo(value);
          setActivePreset(null);
        }}
        onRefresh={refresh}
      />

      {!isRangeValid && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            color: 'var(--danger)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--danger)',
          }}
        >
          {t.admin.analytics.invalidRange}
        </div>
      )}

      {isError && (
        <div
          className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            color: 'var(--danger)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--danger)',
          }}
        >
          <span className="text-sm">{t.admin.analytics.loadError}</span>
          <button type="button" onClick={refresh} className="text-sm font-medium underline">
            {t.admin.analytics.retry}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <AnalyticsMetricCard
          icon={<Eye size={17} />}
          label={t.admin.analytics.totalViews}
          value={overview?.totalViews ?? 0}
          hint={t.admin.analytics.totalEvents.replace(
            '{count}',
            (overview?.totalEvents ?? 0).toLocaleString(),
          )}
        />
        <AnalyticsMetricCard
          icon={<LayoutGrid size={17} />}
          label={t.admin.analytics.benchmarkTestViews}
          value={overview?.benchmarkTestViews ?? 0}
        />
        <AnalyticsMetricCard
          icon={<Layers size={17} />}
          label={t.admin.analytics.benchmarkViews}
          value={overview?.benchmarkViews ?? 0}
        />
        <AnalyticsMetricCard
          icon={<Users size={17} />}
          label={t.admin.analytics.uniqueSessions}
          value={overview?.uniqueSessions ?? 0}
        />
        <AnalyticsMetricCard
          icon={<Search size={17} />}
          label={t.admin.analytics.searches}
          value={overview?.catalogSearches ?? 0}
        />
        <AnalyticsMetricCard
          icon={<Filter size={17} />}
          label={t.admin.analytics.filters}
          value={overview?.filterUsageEvents ?? 0}
        />
      </div>

      <AnalyticsActivityChart
        data={chartData}
        isLoading={overviewQuery.isPending}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnalyticsRankingTable
          title={t.admin.analytics.topBenchmarksTitle}
          subtitle={t.admin.analytics.topBenchmarksSubtitle}
          items={topBenchmarks}
          isLoading={topBenchmarksQuery.isPending}
        />
        <AnalyticsRankingTable
          title={t.admin.analytics.topTestsTitle}
          subtitle={t.admin.analytics.topTestsSubtitle}
          items={topBenchmarkTests}
          isLoading={topBenchmarkTestsQuery.isPending}
        />
      </div>

      <AnalyticsEventsTable
        events={eventsResultQuery.data?.data ?? []}
        total={eventsResultQuery.data?.total ?? 0}
        selectedType={eventType}
        isLoading={eventsResultQuery.isPending}
        onTypeChange={setEventType}
      />
    </div>
  );
}
