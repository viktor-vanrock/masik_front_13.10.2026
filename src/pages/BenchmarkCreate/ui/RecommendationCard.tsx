import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import type { BenchmarkType, RecommendationStatus } from '@/types';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

type RecommendationCardBenchmark = Pick<
  BenchmarkType,
  'id' | 'name' | 'nameEn' | 'domains' | 'taskType'
>;

interface Props {
  benchmark: RecommendationCardBenchmark;
  viewLabel: string;
  recommendationId?: string;
  recommendationStatus?: RecommendationStatus;
  onAccept?: (recommendationId: string) => void;
  onReject?: (recommendationId: string) => void;
  disabled?: boolean;
}

export function RecommendationCard({
  benchmark,
  viewLabel,
  recommendationId,
  recommendationStatus,
  onAccept,
  onReject,
  disabled,
}: Props) {
  const { lang, t } = useApp();
  const title = lang === 'en' ? benchmark.nameEn : benchmark.name;
  const domains = benchmark.domains
    .slice(0, 3)
    .map((domain) => (lang === 'en' ? domain.nameEn : domain.name))
    .join(', ');
  const taskType = benchmark.taskType
    ? lang === 'en'
      ? benchmark.taskType.nameEn
      : benchmark.taskType.name
    : '';
  const metadata = [domains, taskType].filter(Boolean).join(' · ');

  const isSettled = recommendationStatus === 'selected' || recommendationStatus === 'rejected';

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs flex flex-col gap-2"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
      }}
    >
      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {metadata && (
        <p style={{ color: 'var(--text-muted)' }}>
          {metadata}
        </p>
      )}
      <Link
        to={ROUTES.BENCHMARK(benchmark.id)}
        className="inline-flex items-center gap-1 font-medium"
        style={{ color: 'var(--text-blue-on-bg)' }}
      >
        {viewLabel}
        <ExternalLink size={11} />
      </Link>

      {recommendationId && !isSettled && (
        <div className="flex gap-2 mt-0.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAccept?.(recommendationId)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
              color: 'var(--success)',
              border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
            }}
          >
            <CheckCircle2 size={12} />
            {t.create.recommendYes}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject?.(recommendationId)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              color: 'var(--danger)',
              border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
            }}
          >
            <XCircle size={12} />
            {t.create.recommendNo}
          </button>
        </div>
      )}

      {recommendationId && isSettled && (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
          style={{
            backgroundColor:
              recommendationStatus === 'selected'
                ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                : 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
            color:
              recommendationStatus === 'selected'
                ? 'var(--success)'
                : 'var(--text-muted)',
          }}
        >
          {recommendationStatus === 'selected' ? (
            <CheckCircle2 size={11} />
          ) : (
            <XCircle size={11} />
          )}
          {recommendationStatus === 'selected' ? t.create.recommendDone : t.create.recommendNo}
        </div>
      )}
    </div>
  );
}
