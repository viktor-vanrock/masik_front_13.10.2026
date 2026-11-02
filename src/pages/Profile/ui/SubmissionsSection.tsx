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
    color: '#e0b978',
    background: '#382d20',
    icon: Clock3,
  },
  published: {
    color: '#5de3bd',
    background: '#1d302a',
    icon: CheckCircle2,
  },
  rejected: {
    color: '#ff91a0',
    background: '#38232d',
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
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 rounded-[24px] border border-[#acb3cf33] bg-[#1d202f73] px-5 py-[18px] text-[#f2f3fc]"
    >
      <div className="grid min-w-0 gap-1.5">
        <div className="min-w-0">
          <p
            className="m-0 text-[18px] leading-6 font-semibold [overflow-wrap:anywhere]"
          >
            {name}
          </p>
          {submittedAt && (
            <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#8890ad]">
              {t.profile.submitted}:{' '}
              {formatLocaleDate(lang, submittedAt)}
            </p>
          )}
        </div>
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#5865c92e] px-[10px] py-1 text-[12px] leading-[18px] font-semibold text-[#afb8ff]"
          style={{ color: style.color, backgroundColor: style.background }}
        >
          <StatusIcon size={12} />
          {t.profile.submissionStatuses[status]}
        </span>
      </div>

      {submission.catalogEntry?.rejectionReason && (
        <div
          className="flex items-start gap-2 text-xs mt-3 p-3 rounded-lg"
          style={{ color: '#ff91a0', backgroundColor: '#38232d' }}
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
    <section className="mt-14 grid gap-[18px] max-[700px]:mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2
          className="m-0 text-[24px] leading-[1.2] font-medium tracking-[-.01em]"
        >
          {t.profile.myBenchmarks}
        </h2>
        <Link
          to={ROUTES.ADD_BENCHMARK}
          className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-[14px] text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 border-[#ffffff1a] bg-[#ffffff14] text-[#f2f3fc] hover:not-disabled:bg-[#ffffff1f]"
        >
          <PlusCircle size={14} />
          {t.profile.newBenchmark}
        </Link>
      </div>

      {isPending && (
        <p className="text-[14px] text-[#acb3cf]">
          {t.common.loading}
        </p>
      )}
      {isError && (
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-[14px] text-[#ff91a0]"
        >
          {t.catalogue.loadErrorFallback}
        </button>
      )}
      {!isPending && !isError && (data?.data.length ?? 0) === 0 && (
        <p
          className="grid justify-items-center gap-[14px] rounded-[24px] border border-dashed border-[#acb3cf33] px-6 py-9 text-center text-[14px] text-[#acb3cf]"
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
