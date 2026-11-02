import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { useBenchmarkGroupsQuery } from '@/api/catalog';
import { useCatalogAnalyticsTracking } from '@/api/analytics';
import type { BenchmarkGroup } from '@/types';

import { useBenchmarksFilters } from './hooks/useBenchmarksFilters';
import { Header } from './ui/Header';
import { SearchBar } from './ui/SearchBar';
import { FilterPanel } from './ui/FilterPanel';
import { EmptyStateBenchmarksCatalogue } from './ui/EmptyStateBenchmarksCatalogue';
import { SuitesSection } from './ui/SuitesSection';
import { BenchmarksGridSkeleton } from './ui/BenchmarksGridSkeleton';
import { CatalogErrorState } from './ui/CatalogErrorState';

export function BenchmarksCatalogue() {
  const { t } = useApp();

  const {
    filters,
    query,
    toggleFilter,
    updateFilter,
    resetFilters,
    activeFilterCount,
  } = useBenchmarksFilters();

  useCatalogAnalyticsTracking(query);

  const {
    data,
    isPending,
    isPlaceholderData,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBenchmarkGroupsQuery(query);

  const groups: BenchmarkGroup[] = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  // Total бенчмарков (карточек) на загруженных страницах = сумма matchedTestsCount.
  const totalMatchedTests = useMemo(
    () => groups.reduce((sum, g) => sum + g.benchmark.matchedTestsCount, 0),
    [groups],
  );

  const hasResults = groups.length > 0;
  const showSkeleton = isPending && !isPlaceholderData;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        <SearchBar
          value={filters.search}
          onChange={(value) => updateFilter('search', value)}
          placeholder={t.catalogue.search}
        />

        <FilterPanel
          filters={filters}
          total={totalMatchedTests}
          toggleFilter={toggleFilter}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
        />

        {isError && <CatalogErrorState error={error} onRetry={refetch} />}

        {!isError && showSkeleton && <BenchmarksGridSkeleton />}

        {!isError && !showSkeleton && !hasResults && (
          <EmptyStateBenchmarksCatalogue onReset={resetFilters} />
        )}

        {!isError && !showSkeleton && hasResults && (
          <div
            className="space-y-10"
            style={{
              opacity: isPlaceholderData ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <SuitesSection sections={groups} title={t.catalogue.suitesSection} />

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {isFetchingNextPage ? t.catalogue.loading : t.catalogue.loadMore}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
