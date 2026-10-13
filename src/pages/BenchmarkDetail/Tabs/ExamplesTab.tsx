import { LayoutGrid } from 'lucide-react';
import { ExampleCard } from '../ui/ExampleCard';
import type { BenchmarkType, DatasetSubsample } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  benchmark: BenchmarkType;
}

export const ExamplesTab = ({ benchmark }: Props) => {
  const { t, lang } = useApp();

  const datasetSubsamplesWithExamples = (benchmark.datasetSubsamples ?? []).filter(
    (ds: DatasetSubsample) => ds.examples && ds.examples.length > 0,
  );

  return (
    <div>
      <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
        {t.benchmark.examples}
      </h2>
      <div className="space-y-5 mb-8">
        {benchmark.examples.map((ex, i) => (
          <ExampleCard key={i} ex={ex} t={t} />
        ))}
      </div>
      {datasetSubsamplesWithExamples.length > 0 && (
        <div>
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border)',
              paddingTop: '1.5rem',
            }}
          >
            {t.benchmark.subsamples}
          </h3>
          <div className="space-y-6">
            {datasetSubsamplesWithExamples.map((ds) => (
              <div key={ds.id}>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid size={13} style={{ color: 'var(--border)' }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lang === 'en' ? ds.nameEn : ds.name}
                  </span>
                </div>
                <div className="space-y-3 pl-4" style={{ borderLeft: '2px solid var(--border)' }}>
                  {ds.examples!.map((ex, i) => (
                    <ExampleCard key={i} ex={ex} t={t} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
