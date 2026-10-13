import { AlertCircle, CheckCircle2, Clock3, PlusCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMyCatalogSubmissionsQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';
import type { BenchmarkType, BenchmarkValidationStatus } from '@/types';
import { formatLocaleDate } from '@/utils/format/date';

const STATUS_STYLE: Record<
  BenchmarkValidationStatus,
  { color: string; background: string; icon: typeof Clock3 }
> = {
  validation: {
    color: 'var(--warning)',
    background: 'var(--bg-elevated)',
    icon: Clock3,
  },
  published: {
    color: 'var(--success)',
    background: 'var(--status-done-bg)',
    icon: CheckCircle2,
  },
  rejected: {
    color: 'var(--danger)',
    background: '#FEF2F2',
    icon: XCircle,
  },
};

function SubmissionCard({ submission }: { submission: BenchmarkType }) {
  const { t, lang } = useApp();
  const status =
    submission.catalogEntry?.status ??
    submission.validationStatus ??
    'validation';
  const style = STATUS_STYLE[status];
  const StatusIcon = style.icon;
  const name = lang === 'en' ? submission.nameEn : submission.name;
  const submittedAt = submission.catalogEntry?.submittedAt;

  const content = (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {name}
          </p>
          {submittedAt && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t.profile.submitted}:{' '}
              {formatLocaleDate(lang, submittedAt)}
            </p>
          )}
        </div>
        <span
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
          style={{ color: style.color, backgroundColor: style.background }}
        >
          <StatusIcon size={12} />
          {t.profile.submissionStatuses[status]}
        </span>
      </div>

      {submission.catalogEntry?.rejectionReason && (
        <div
          className="flex items-start gap-2 text-xs mt-3 p-3 rounded-lg"
          style={{ color: 'var(--danger)', backgroundColor: '#FEF2F2' }}
        >
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>{t.profile.rejectionReason}:</strong>{' '}
            {submission.catalogEntry.rejectionReason}
          </span>
        </div>
      )}
    </div>
  );

  return status === 'published' ? (
    <Link to={ROUTES.BENCHMARK(submission.id)}>{content}</Link>
  ) : (
    content
  );
}

export function SubmissionsSection() {
  const { t } = useApp();
  const { data, isPending, isError, refetch } =
    useMyCatalogSubmissionsQuery({ limit: 100 });

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {t.profile.myBenchmarks}
        </h2>
        <Link
          to={ROUTES.ADD_BENCHMARK}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={14} />
          {t.profile.newBenchmark}
        </Link>
      </div>

      {isPending && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.common.loading}
        </p>
      )}
      {isError && (
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm"
          style={{ color: 'var(--danger)' }}
        >
          {t.catalogue.loadErrorFallback}
        </button>
      )}
      {!isPending && !isError && (data?.data.length ?? 0) === 0 && (
        <p
          className="text-sm p-4 rounded-xl"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {t.profile.emptySubmissions}
        </p>
      )}
      <div className="space-y-3">
        {data?.data.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
      </div>
    </section>
  );
}
