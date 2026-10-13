import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ApiException } from '@/services/http';
import { useBenchmarkQuery } from '@/api/catalog';
import { useMetricResultsQuery } from '@/api/metrics';
import { useBenchmarkViewTracking } from '@/api/analytics';
import { useApp } from '@/hooks/useApp';
import { BackButton } from '@/components/ui/BackButton';
import { ADDITIONAL_TABS, BASE_TABS, type Tab } from './constants';
import { OverviewTab } from './Tabs/OverviewTab';
import { ExamplesTab } from './Tabs/ExamplesTab';
import { ScoresTab } from './Tabs/ScoresTab';
import { ReferencesTab } from './Tabs/ReferencesTab';
import { DatasetSubsamplesTab } from './Tabs/DatasetSubsamplesTab';
import { HeaderCard } from './ui/HeaderCard';
import { BenchmarkDetailSkeleton } from './ui/BenchmarkDetailSkeleton';
import { CatalogErrorState } from '../BenchmarksCatalogue/ui/CatalogErrorState';

export function BenchmarkDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useApp();
  const { data: benchmark, isPending, isError, error, refetch } = useBenchmarkQuery({ id });
  const {
    data: metricResultsResponse,
    isPending: areMetricResultsPending,
    isError: areMetricResultsError,
    error: metricResultsError,
    refetch: refetchMetricResults,
  } = useMetricResultsQuery(id, { limit: 1000, sortColumn: 'obtainedAt', sortDirection: 'DESC' });
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useBenchmarkViewTracking({
    benchmarkId: benchmark?.suiteId,
    benchmarkTestId: benchmark?.id,
    enabled: Boolean(benchmark) && !isError,
  });

  // 404 / 403 — навигационные редиректы; прочие ошибки — плашка с retry.
  if (isError && error instanceof ApiException) {
    if (error.status === 404) return <Navigate to="/" replace />;
    if (error.status === 403) return <Navigate to="/forbidden" replace />;
  }

  if (isPending) return <BenchmarkDetailSkeleton />;

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton link="/" />
        <CatalogErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // `data` гарантированно есть: !isPending && !isError.
  if (!benchmark) return <Navigate to="/" replace />;

  const { datasetSubsamples } = benchmark;
  const hasDatasetSubsamples = datasetSubsamples && datasetSubsamples.length > 0;

  const tabLabels: Record<Tab, string> = {
    overview: t.benchmark.overview,
    examples: t.benchmark.examples,
    scores: t.benchmark.scores,
    references: t.benchmark.references,
    subsamples: t.benchmark.subsamples,
  };

  const visibleTabs: Tab[] = hasDatasetSubsamples
    ? [...BASE_TABS, ...ADDITIONAL_TABS]
    : [...BASE_TABS];

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton link="/" />
        <HeaderCard benchmark={benchmark} />
        <div
          className="flex gap-1 mb-6 rounded-xl p-1 flex-wrap"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-w-[80px]"
              style={{
                backgroundColor: activeTab === tab ? 'var(--nav-blue-bg)' : 'transparent',
                color: activeTab === tab ? 'var(--text-blue-on-bg)' : 'var(--text-secondary)',
              }}
            >
              {tabLabels[tab]}
              {tab === 'subsamples' && hasDatasetSubsamples && (
                <span
                  className="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff', opacity: 0.85 }}
                >
                  {datasetSubsamples!.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {activeTab === 'overview' && <OverviewTab benchmark={benchmark} />}
          {activeTab === 'examples' && <ExamplesTab benchmark={benchmark} />}
          {activeTab === 'scores' && (
            <ScoresTab
              benchmark={benchmark}
              results={metricResultsResponse?.data ?? []}
              isPending={areMetricResultsPending}
              isError={areMetricResultsError}
              error={metricResultsError}
              onRetry={() => void refetchMetricResults()}
            />
          )}
          {activeTab === 'references' && <ReferencesTab benchmark={benchmark} />}
          {activeTab === 'subsamples' && hasDatasetSubsamples && (
            <DatasetSubsamplesTab
              datasetSubsamples={datasetSubsamples!}
            />
          )}
        </div>
      </div>
    </div>
  );
}
