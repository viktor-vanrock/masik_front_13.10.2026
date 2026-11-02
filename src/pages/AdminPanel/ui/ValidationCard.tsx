import { useMemo } from 'react';
import { Globe, Layers, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import type { AppLang } from '@/features/catalog/selectors';
import { useApp } from '@/hooks/useApp';
import { formatLocaleDate } from '@/utils/format/date';
import { hasAssignedMetric } from './validationRules';

interface ValidationCardProps {
  b: BenchmarkType;
  lang: AppLang;
  t: ReturnType<typeof useApp>['t'];
  isPending: boolean;
  onOpen: () => void;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}

export function ValidationCard({
  b,
  lang,
  t,
  isPending,
  onOpen,
  onApprove,
  onReject,
}: ValidationCardProps) {
  const vm = useMemo(() => selectBenchmarkTestVM(b, lang), [b, lang]);
  const canApprove = hasAssignedMetric(b);

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canApprove && !isPending) void onApprove();
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPending) void onReject();
  };

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {vm.jiraTicketId && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-blue-tint)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                }}
              >
                {vm.jiraTicketId}
              </span>
            )}
            {vm.isGenerated && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                AI-generated
              </span>
            )}
          </div>

          <p
            className="font-semibold text-sm mb-1 truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {vm.displayName}
          </p>

          {vm.displayDescription && (
            <p
              className="text-xs line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {vm.displayDescription}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {vm.language && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Globe size={10} />
                {vm.language.label}
              </span>
            )}
            {vm.taskType && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Layers size={10} />
                {vm.taskType.label}
              </span>
            )}
            {vm.generatedAt && (
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {formatLocaleDate(lang, vm.generatedAt)}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className="flex-shrink-0 mt-1"
          style={{ color: 'var(--text-dim)' }}
        />
      </div>

      <div
        className="mt-3 pt-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            <XCircle size={12} />
            {t.admin.rejectBtn}
          </button>
          <button
            onClick={handleApprove}
            disabled={!canApprove || isPending}
            title={!canApprove ? t.admin.metricRequiredForPublication : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              border: '1px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={12} />
            {t.admin.approveBtn}
          </button>
        </div>
        {!canApprove && (
          <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
            {t.admin.metricRequiredForPublication}
          </p>
        )}
      </div>
    </div>
  );
}
