import { Layers } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { formatBenchmarkCount } from '@/utils/format/pluralBenchmarks';
import type { BenchmarkGroupSuite } from '@/types';

interface Props {
  suite: BenchmarkGroupSuite;
}

export const SuiteCard = ({ suite }: Props) => {
  const { t, lang } = useApp();
  const title = lang === 'en' ? suite.nameEn : suite.name;
  const desc =
    lang === 'en'
      ? suite.descriptionEn ?? suite.description
      : suite.description ?? suite.descriptionEn;

  const totalLabel = formatBenchmarkCount(t, lang, suite.benchmarkTestsCount);

  const showMatched = suite.matchedTestsCount < suite.benchmarkTestsCount;

  // TODO(suite-actions): на бэке у `Benchmark` нет gigaMetric*-полей.
  // Кнопки «копировать команду» и «открыть сет» убраны до решения о хранении
  // этих полей на уровне категории.

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--text-blue-on-bg)' }}
        >
          <Layers size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {totalLabel}
            </span>
            {showMatched && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                · {suite.matchedTestsCount} / {suite.benchmarkTestsCount}
              </span>
            )}
          </div>
          {desc && (
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {desc}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
