import { LayoutGrid } from 'lucide-react';
import type { DatasetSubsample } from '@/types';
import { useApp } from '@/hooks/useApp';
import { selectDatasetSubsampleVM } from '@/features/catalog/selectors';

interface Props {
  datasetSubsamples: DatasetSubsample[];
}

export function DatasetSubsamplesTab({ datasetSubsamples }: Props) {
  const { t, lang } = useApp();
  const vms = datasetSubsamples.map((subsample) =>
    selectDatasetSubsampleVM(subsample, lang),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
          {t.benchmark.subsamples}
        </h2>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          {vms.length}
        </span>
      </div>

      <div className="space-y-2">
        {vms.map((subsample) => (
          <div
            key={subsample.id}
            className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-3">
              <LayoutGrid
                size={13}
                style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 4 }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {subsample.displayName}
                </p>
                {subsample.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {subsample.description}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {subsample.sizeInSamples.toLocaleString()} {t.common.samples}
                  {subsample.split ? ` · ${subsample.split}` : ''}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
