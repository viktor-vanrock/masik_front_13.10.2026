import { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { BenchmarkType } from '@/types';
import { useApp } from '@/hooks/useApp';
import { useApiError } from '@/hooks/useApiError';
import {
  useManagementBenchmarksQuery,
  useModerateCatalogEntryMutation,
} from '@/api/catalog';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { BenchmarksGridSkeleton } from '@/pages/BenchmarksCatalogue/ui/BenchmarksGridSkeleton';
import { ValidationCard } from './ValidationCard';
import { ValidationDetailModal } from './ValidationDetailModal';
import { hasAssignedMetric } from './validationRules';

export const AdminValidationTab = () => {
  const { t, lang } = useApp();
  const [detailTarget, setDetailTarget] = useState<BenchmarkType | null>(null);
  const { serverError, clearError, handleError } = useApiError();

  const { data, isPending, isError, error, refetch } =
    useManagementBenchmarksQuery({ limit: 100 });
  const pendingValidation = useMemo(
    () => (data?.data ?? []).filter((b) => b.validationStatus === 'validation'),
    [data],
  );

  const moderationMutation = useModerateCatalogEntryMutation();

  const handleApprove = async (b: BenchmarkType) => {
    clearError();
    if (!hasAssignedMetric(b)) {
      handleError(new Error(t.admin.metricRequiredForPublication), {
        fallback: t.admin.metricRequiredForPublication,
      });
      return;
    }
    try {
      await moderationMutation.mutateAsync({
        id: b.id,
        decision: { status: 'published' },
      });
      if (detailTarget?.id === b.id) setDetailTarget(null);
    } catch (moderationError) {
      handleError(moderationError, { fallback: t.common.errors.saveFailed });
    }
  };

  const handleReject = async (b: BenchmarkType) => {
    const reason = window.prompt(t.admin.rejectionReasonPrompt)?.trim();
    if (!reason) return;
    clearError();
    try {
      await moderationMutation.mutateAsync({
        id: b.id,
        decision: { status: 'rejected', rejectionReason: reason },
      });
      if (detailTarget?.id === b.id) setDetailTarget(null);
    } catch (moderationError) {
      handleError(moderationError, { fallback: t.common.errors.saveFailed });
    }
  };

  if (isError) return <CatalogErrorState error={error} onRetry={refetch} />;
  if (isPending) return <BenchmarksGridSkeleton />;

  if (pendingValidation.length === 0) {
    return (
      <div
        className="rounded-xl py-16 flex flex-col items-center gap-3"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.admin.validationEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            color: 'var(--danger)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--danger)',
          }}
        >
          {serverError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingValidation.map((b) => (
          <ValidationCard
            key={b.id}
            b={b}
            lang={lang}
            t={t}
            isPending={moderationMutation.isPending}
            onOpen={() => setDetailTarget(b)}
            onApprove={() => handleApprove(b)}
            onReject={() => handleReject(b)}
          />
        ))}
        {detailTarget && (
          <ValidationDetailModal
            b={detailTarget}
            isPending={moderationMutation.isPending}
            onClose={() => setDetailTarget(null)}
            onApprove={() => handleApprove(detailTarget)}
            onReject={() => handleReject(detailTarget)}
          />
        )}
      </div>
    </div>
  );
};
