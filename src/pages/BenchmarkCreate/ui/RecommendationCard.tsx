import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { BenchmarkType, RecommendationStatus } from '@/types';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

type RecommendationCardBenchmark = Pick<BenchmarkType, 'id' | 'name' | 'nameEn' | 'domains' | 'taskType'> & Partial<Pick<BenchmarkType, 'language' | 'metrics'>>;
interface Props {
  benchmark: RecommendationCardBenchmark;
  viewLabel: string;
  recommendationId?: string;
  recommendationStatus?: RecommendationStatus;
  onAccept?: (recommendationId: string) => void;
  onReject?: (recommendationId: string) => void;
  disabled?: boolean;
}

export function RecommendationCard({ benchmark, viewLabel, ...actions }: Props) {
  const { lang } = useApp();
  const title = lang === 'en' ? benchmark.nameEn || benchmark.name : benchmark.name;
  const metadata = [
    benchmark.language ? (lang === 'en' ? benchmark.language.nameEn || benchmark.language.name : benchmark.language.name) : '',
    benchmark.metrics?.[0],
  ].filter(Boolean).join(' · ');
  return <div className="recommendation" role="group" aria-label={title}>
    <Link to={ROUTES.BENCHMARK(encodeURIComponent(benchmark.id))} aria-label={`${title}: ${viewLabel}`}><b>{title}</b><span>{metadata}</span><ChevronRight aria-hidden="true" /></Link>
    <RecommendationActions {...actions} />
  </div>;
}

function RecommendationActions({ recommendationId, recommendationStatus, onAccept, onReject, disabled }: Pick<Props, 'recommendationId' | 'recommendationStatus' | 'onAccept' | 'onReject' | 'disabled'>) {
  const { t } = useApp();
  if (!recommendationId) return null;
  if (recommendationStatus === 'selected' || recommendationStatus === 'rejected') return <p className="muted" role="status">{recommendationStatus === 'selected' ? t.create.recommendDone : t.create.recommendNo}</p>;
  return <div className="chips"><button className="chip pri" type="button" disabled={disabled || !onAccept} onClick={() => onAccept?.(recommendationId)}>{t.create.recommendYes}</button><button className="chip" type="button" disabled={disabled || !onReject} onClick={() => onReject?.(recommendationId)}>{t.create.recommendNo}</button></div>;
}
