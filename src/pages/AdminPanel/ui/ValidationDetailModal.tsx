import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import { ModalHeader } from './ModalHeader';
import { hasAssignedMetric } from './validationRules';

interface Props {
  b: BenchmarkType;
  isPending: boolean;
  onClose: () => void;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}

/**
 * Validation review modal — view-only. Full benchmark editing lives on
 * `/admin/edit/:id` (Phase 5). This modal surfaces the key fields and the
 * approve/reject actions so admins can triage from the validation tab
 * without leaving it.
 */
export const ValidationDetailModal = ({
  b,
  isPending,
  onClose,
  onApprove,
  onReject,
}: Props) => {
  const { t, lang } = useApp();
  const vm = useMemo(() => selectBenchmarkTestVM(b, lang), [b, lang]);
  const canApprove = hasAssignedMetric(b);

  const summaryRows: Array<{ label: string; value: string }> = [];
  if (vm.macroGroup) summaryRows.push({ label: t.benchmark.macroGroup, value: vm.macroGroup.label });
  if (vm.taskType) summaryRows.push({ label: t.benchmark.taskType, value: vm.taskType.label });
  if (vm.language) summaryRows.push({ label: t.benchmark.language, value: vm.language.label });
  if (vm.difficulty) summaryRows.push({ label: t.benchmark.difficulty, value: vm.difficulty.label });
  if (vm.modalities.length > 0) {
    summaryRows.push({
      label: t.benchmark.modality,
      value: vm.modalities.map((m) => m.label).join(', '),
    });
  }
  summaryRows.push({
    label: t.benchmark.size,
    value: `${vm.sizeInSamples.toLocaleString()} ${t.common.samples}`,
  });
  summaryRows.push({
    label: t.benchmark.metrics,
    value: vm.metrics.length > 0 ? vm.metrics.join(', ') : '—',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          benchmark={{
            name: vm.name,
            nameEn: vm.nameEn,
            jiraTicketId: vm.jiraTicketId,
            isGenerated: vm.isGenerated,
            generatedAt: vm.generatedAt,
          }}
          lang={lang}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <section>
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.benchmark.overview}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {vm.displayDescription || '—'}
            </p>
          </section>

          <section>
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.catalogue.parametersSection}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summaryRows.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-start gap-2 py-2 px-3 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
                  >
                    {label}
                  </span>
                  <span
                    className="text-xs text-right"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {vm.capabilities.length > 0 && (
            <section>
              <p
                className="text-xs uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.benchmark.capabilities}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {vm.capabilities.map((cap) => (
                  <span
                    key={cap.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--bg-blue-tint)',
                      color: 'var(--text-blue-on-bg)',
                    }}
                  >
                    {cap.label}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!canApprove && (
            <div
              role="alert"
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                color: 'var(--danger)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--danger)',
              }}
            >
              {t.admin.metricRequiredForPublication}
            </div>
          )}

          <Link
            to={`/admin/edit/${vm.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            {t.admin.editBenchmark}
            <ExternalLink size={12} />
          </Link>
        </div>

        <div
          className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={() => void onReject()}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            <XCircle size={14} />
            {t.admin.rejectBtn}
          </button>
          <button
            onClick={() => void onApprove()}
            disabled={!canApprove || isPending}
            title={!canApprove ? t.admin.metricRequiredForPublication : undefined}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              border: '1px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={14} />
            {t.admin.approveBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
