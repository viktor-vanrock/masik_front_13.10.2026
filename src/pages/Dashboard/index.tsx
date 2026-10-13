import { useMemo } from 'react';
import { useBenchmarkGroupsQuery } from '@/api/catalog';
import { useMetricModelsQuery } from '@/api/metrics';
import { MODEL_COLORS_DARK, MODEL_COLORS_LIGHT } from "./consts";
import { useDashboard } from "./hooks/useDashboard";
import { ModelFilter } from "./ui/ModelFilter";
import { MetricFilter } from './ui/MetricFilter';
import { BenchmarkFilter } from "./ui/BenchmarkFilter";
import { TabSwitcher } from "./ui/TabSwitcher";
import { BarChartView } from "./ui/BarChartView";
import { RadarChartView } from "./ui/RadarChartView";
import { useApp } from "@/hooks/useApp";
import { ScoreTable } from "./ui/ScoreTable";
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import type { BenchmarkGroup, BenchmarkType } from '@/types';
import type { DashboardSuite } from './data/types';


export function Dashboard() {
  const { lang, t, theme } = useApp();
  const MODEL_COLORS = theme === 'dark' ? MODEL_COLORS_DARK : MODEL_COLORS_LIGHT;

  const {
    data: groupsResponse,
    isPending: isGroupsPending,
    isError: isGroupsError,
    error: groupsError,
    refetch: refetchGroups,
  } = useBenchmarkGroupsQuery({}, { pageSize: 1000 });
  const {
    data: models = [],
    isPending: isModelsPending,
    isError: isModelsError,
    error: modelsError,
    refetch: refetchModels,
  } = useMetricModelsQuery();

  const groups: BenchmarkGroup[] = useMemo(
    () => groupsResponse?.pages.flatMap((page) => page.data) ?? [],
    [groupsResponse],
  );
  const benchmarks: BenchmarkType[] = useMemo(
    () => groups.flatMap((group) => group.tests),
    [groups],
  );
  const benchmarkSuites: DashboardSuite[] = useMemo(
    () => groups.map((group) => ({
      id: group.benchmark.id,
      name: group.benchmark.name,
      nameEn: group.benchmark.nameEn,
      description: group.benchmark.description ?? undefined,
      descriptionEn: group.benchmark.descriptionEn ?? undefined,
      testIds: group.tests.map((test) => test.id),
      aggregate: 'mean',
    })),
    [groups],
  );

  const {
    // State
    selectedModels,
    selectedBenchmarks,
    sort,
    activeTab,
    expandedSuites,
    activeMetricId,
    // Computed data
    visibleModels,
    bmMap,
    scoreMatrix,
    modelAverages,
    orderedTopRows,
    barBreakdownRows,
    radarData,
    metricOptions,
    // Actions
    setActiveTab,
    setSelectedMetricId,
    handleSort,
    toggleModel,
    toggleBenchmark,
    toggleEntireSuite,
    toggleExpandedSuite,
  } = useDashboard(lang, benchmarks, benchmarkSuites, models);

  const isPending = isGroupsPending || isModelsPending;
  const isError = isGroupsError || isModelsError;
  const error = groupsError ?? modelsError;
  const hasMetricResults = benchmarks.some((benchmark) =>
    benchmark.scores.some((score) => !score.isHumanBaseline),
  );

  const retry = () => {
    void refetchGroups();
    void refetchModels();
  };

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-xl p-8 text-sm text-center"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {t.catalogue.loading}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CatalogErrorState error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t.dashboard.title}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>{t.dashboard.subtitle}</p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          <aside className="lg:w-56 flex-shrink-0 space-y-5">
            <ModelFilter
              selectedModels={selectedModels}
              models={models}
              toggleModel={toggleModel}
              modelColors={MODEL_COLORS}
            />

            <MetricFilter
              metrics={metricOptions}
              activeMetricId={activeMetricId}
              onChange={setSelectedMetricId}
            />
            
            <BenchmarkFilter
              selectedBenchmarks={selectedBenchmarks}
              benchmarks={benchmarks}
              benchmarkSuites={benchmarkSuites}
              bmMap={bmMap}
              toggleBenchmark={toggleBenchmark}
              toggleEntireSuite={toggleEntireSuite}
            />
          </aside>

          <div className="flex-1 min-w-0 space-y-5">
            {!hasMetricResults && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                {t.dashboard.noMetricResults}
              </div>
            )}
            <TabSwitcher
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />

            {activeTab === 'table' && (
              <ScoreTable
                orderedTopRows={orderedTopRows}
                visibleModels={visibleModels}
                modelColors={MODEL_COLORS}
                scoreMatrix={scoreMatrix}
                expandedSuites={expandedSuites}
                toggleExpandedSuite={toggleExpandedSuite}
                selectedBenchmarks={selectedBenchmarks}
                bmMap={bmMap}
                sort={sort}
                handleSort={handleSort}
                modelAverages={modelAverages}
                activeMetricId={activeMetricId}
              />
            )}

            {activeTab === 'bar' && hasMetricResults && (
              <BarChartView
                modelAverages={modelAverages}
                barBreakdownRows={barBreakdownRows}
                visibleModels={visibleModels}
                bmMap={bmMap}
                selectedBenchmarks={selectedBenchmarks}
                modelColors={MODEL_COLORS}
                activeMetricId={activeMetricId}
              />
            )}

            {activeTab === 'radar' && hasMetricResults && (
              <RadarChartView
                radarData={radarData}
                visibleModels={visibleModels}
                modelColors={MODEL_COLORS}
              />
            )}

            {activeTab !== 'table' && !hasMetricResults && (
              <div
                className="rounded-xl p-10 text-center text-sm"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {t.dashboard.noMetricResults}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
