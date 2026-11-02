import { useState, useMemo } from 'react';
import type { BenchmarkType } from '@/types';
import { useManagementBenchmarksQuery } from '@/api/catalog';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useApp } from '@/hooks/useApp';
import { SearchInput } from '@/components/ui/SearchInput';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { BenchmarksGridSkeleton } from '@/pages/BenchmarksCatalogue/ui/BenchmarksGridSkeleton';
import { BenchmarksTable } from './BenchmarksTable';
import { DeleteModal } from './DeleteModal';
import { UploadModal } from './UploadModal';

export function AdminBenchmarksTab() {
  const { t, lang } = useApp();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [uploadTarget, setUploadTarget] = useState<BenchmarkType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BenchmarkType | null>(null);

  const query = useMemo(() => {
    const trimmed = debouncedSearch.trim();
    return trimmed ? { search: trimmed, limit: 100 } : { limit: 100 };
  }, [debouncedSearch]);

  const { data, isPending, isError, error, refetch } =
    useManagementBenchmarksQuery(query);
  const benchmarks = data?.data ?? [];

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t.admin.searchPlaceholder}
      />

      {isError && <CatalogErrorState error={error} onRetry={refetch} />}

      {!isError && isPending && <BenchmarksGridSkeleton />}

      {!isError && !isPending && (
        <BenchmarksTable
          benchmarks={benchmarks}
          lang={lang}
          onUpload={setUploadTarget}
          onDelete={setDeleteTarget}
          labels={{
            colName: t.admin.colName,
            colGroup: t.admin.colGroup,
            colSamples: t.admin.colSamples,
            colScores: t.admin.colScores,
            colActions: t.admin.colActions,
            validationBadge: t.admin.validationBadge,
            upload: t.admin.uploadResults,
            edit: t.admin.editBenchmark,
            delete: t.admin.deleteBenchmark,
            noResults: t.catalogue.noResults,
          }}
        />
      )}

      {deleteTarget && (
        <DeleteModal deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget} />
      )}
      {uploadTarget && (
        <UploadModal uploadTarget={uploadTarget} setUploadTarget={setUploadTarget} />
      )}
    </div>
  );
}
