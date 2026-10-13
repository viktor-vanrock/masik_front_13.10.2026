import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  ExternalLink,
  BookOpen,
  Globe,
  Database,
  Tag,
  Layers,
  LayoutGrid,
  User,
  Copy,
} from 'lucide-react';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import { useApp } from '@/hooks/useApp';
import { Badge } from './Badge';
import { MetaPill } from './MetaPill';
import { CapPill } from './CapPill';

interface Props {
  benchmark: BenchmarkType;
}

export const HeaderCard = ({ benchmark }: Props) => {
  const [copiedLaunch, setCopiedLaunch] = useState(false);
  const { lang, t } = useApp();
  const vm = useMemo(
    () => selectBenchmarkTestVM(benchmark, lang),
    [benchmark, lang],
  );

  const hasDatasetSubsamples = vm.datasetSubsamples.length > 0;
  const humanBaseline = vm.humanBaseline;

  async function copyLaunchCommand() {
    if (!vm.gigaMetricLaunchCommand) return;
    try {
      await navigator.clipboard.writeText(vm.gigaMetricLaunchCommand);
      setCopiedLaunch(true);
      setTimeout(() => setCopiedLaunch(false), 2000);
    } catch {
      setCopiedLaunch(false);
    }
  }

  const modalitiesLabel = vm.modalities.map((m) => m.label).join(', ');

  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          {(vm.macroGroup || vm.subGroups.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {vm.macroGroup && (
                <Badge color="var(--badge-red)">{vm.macroGroup.label}</Badge>
              )}
              {vm.subGroups.map((sg) => (
                <Badge key={sg.id} color="var(--add-blue-300)">{sg.label}</Badge>
              ))}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {vm.displayName}
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {vm.displayDescription}
          </p>
        </div>
        {(vm.gigaMetricLaunchCommand || vm.gigaMetricSetUrl) && (
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 sm:pt-1">
            {vm.gigaMetricLaunchCommand && (
              <button
                type="button"
                onClick={copyLaunchCommand}
                className="inline-flex items-center justify-center p-1.5 rounded-md transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
                title={copiedLaunch ? t.benchmark.copied : t.benchmark.copyLaunchCommand}
              >
                <Copy size={15} />
              </button>
            )}
            {vm.gigaMetricSetUrl && (
              <a
                href={vm.gigaMetricSetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1.5 rounded-md transition-colors"
                style={{
                  color: 'var(--text-blue-on-bg)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-blue-tint)',
                }}
                title={t.benchmark.openInGitVerse}
              >
                <ExternalLink size={15} />
              </a>
            )}
            <Link
              to="/guide"
              className="inline-flex items-center justify-center p-1.5 rounded-md transition-colors"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-elevated)',
              }}
              title={t.benchmark.seeGuide}
            >
              <BookOpen size={15} />
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
        {vm.taskType && (
          <MetaPill icon={<span className="text-xs font-medium">{vm.taskType.label}</span>} label="" plain />
        )}
        {vm.language && (
          <MetaPill icon={<Globe size={13} />} label={vm.language.label} />
        )}
        {vm.difficulty && (
          <MetaPill icon={<Tag size={13} />} label={vm.difficulty.label} />
        )}
        <MetaPill
          icon={<Database size={13} />}
          label={`${vm.sizeInSamples.toLocaleString()} ${t.common.samples}`}
        />
        {modalitiesLabel && (
          <MetaPill icon={<Layers size={13} />} label={modalitiesLabel} />
        )}
        {hasDatasetSubsamples && (
          <MetaPill
            icon={<LayoutGrid size={13} />}
            label={`${vm.datasetSubsamples.length} ${t.common.subsamples}`}
          />
        )}
        {humanBaseline !== undefined && (
          <MetaPill
            icon={<User size={13} />}
            label={`${t.benchmark.humanShort}: ${humanBaseline.toFixed(1)}`}
            highlight
          />
        )}
        {vm.capabilities.map((cap) => (
          <CapPill key={cap.id} label={cap.label} />
        ))}
      </div>
    </div>
  );
};
