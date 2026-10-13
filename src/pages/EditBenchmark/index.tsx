import { useParams, Navigate } from 'react-router-dom';
import { ApiException } from '@/services/http';
import { useManagementBenchmarkQuery } from '@/api/catalog';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { EditBenchmarkSections } from './ui/EditBenchmarkSections';
import { EditBenchmarkSkeleton } from './ui/EditBenchmarkSkeleton';

export const EditBenchmark = () => {
  const { id } = useParams<{ id: string }>();
  const { data: benchmark, isPending, isError, error, refetch } =
    useManagementBenchmarkQuery({ id });

  // 404 / 403 — навигационные редиректы; прочие ошибки — плашка с retry.
  if (isError && error instanceof ApiException) {
    if (error.status === 404) return <Navigate to="/admin" replace />;
    if (error.status === 403) return <Navigate to="/forbidden" replace />;
  }

  if (isPending) return <EditBenchmarkSkeleton />;

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CatalogErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!benchmark) return <Navigate to="/admin" replace />;

  return <EditBenchmarkSections benchmark={benchmark} />;
};
