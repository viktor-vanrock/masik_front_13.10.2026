import { useMemo } from 'react';
import { ExternalLink, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { TagList } from '../ui/TagList';
import { DistBar } from '../ui/DistBar';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  benchmark: BenchmarkType;
}

export const OverviewTab = ({ benchmark }: Props) => {
  const { t, lang } = useApp();
  const vm = useMemo(
    () => selectBenchmarkTestVM(benchmark, lang),
    [benchmark, lang],
  );

  const sourceLabel = t.benchmark.codebase;
  const subGroupLabels = vm.subGroups.map((s) => s.label);
  const abilityTaxonLabels = vm.abilityTaxons.map((a) => a.label);
  const domainLabels = vm.domains.map((d) => d.label);
  const subdomainLabels = vm.subdomains.map((s) => s.label);
  const modalitiesLabel = vm.modalities.map((m) => m.label).join(', ');

  const NameRow = <span style={{ color: 'var(--text-primary)' }}>{vm.displayName}</span>;
  const CodeBaseRow = (
    <a
      href={vm.codebase.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 hover:underline"
      style={{ color: 'var(--accent-nav)' }}
    >
      {vm.codebase.name} <ExternalLink size={12} />
    </a>
  );
  const MetricsRow = <span style={{ color: 'var(--text-primary)' }}>{vm.metrics.join(', ')}</span>;
  const MacroGroupRow = vm.macroGroup && (
    <span style={{ color: 'var(--text-primary)' }}>{vm.macroGroup.label}</span>
  );
  const TaskTypeRow = vm.taskType && (
    <span style={{ color: 'var(--text-primary)' }}>{vm.taskType.label}</span>
  );
  const LanguageRow = vm.language && (
    <span style={{ color: 'var(--text-primary)' }}>{vm.language.label}</span>
  );
  const DifficultyRow = vm.difficulty && (
    <span style={{ color: 'var(--text-primary)' }}>{vm.difficulty.label}</span>
  );
  const ModalityRow = modalitiesLabel && (
    <span style={{ color: 'var(--text-primary)' }}>{modalitiesLabel}</span>
  );
  const Size = (
    <span style={{ color: 'var(--text-primary)' }}>
      {vm.sizeInSamples.toLocaleString()} {t.common.samples}
    </span>
  );
  const MedianSize = (
    <span style={{ color: 'var(--text-primary)' }}>
      {vm.medianSampleSizeWords} {t.common.words}
    </span>
  );
  const PrimaryText = (v: string | number) => (
    <span style={{ color: 'var(--text-primary)' }}>{v}</span>
  );

  const rows: [string, ReactNode][] = [
    [t.benchmark.name, NameRow],
    [sourceLabel, CodeBaseRow],
    [t.benchmark.metrics, MetricsRow],
    ...(MacroGroupRow ? ([[t.benchmark.macroGroup, MacroGroupRow]] as [string, ReactNode][]) : []),
    ...(subGroupLabels.length > 0
      ? ([
        [
          t.benchmark.subGroup,
          <TagList
            key="subGroups"
            items={subGroupLabels}
            color="var(--text-secondary)"
            bg="var(--bg-blue-tint)"
          />,
        ],
      ] as [string, ReactNode][])
      : []),
    ...(abilityTaxonLabels.length > 0
      ? ([
        [
          t.benchmark.abilityTaxon,
          <TagList
            key="abilityTaxons"
            items={abilityTaxonLabels}
            color="var(--text-secondary)"
            bg="var(--bg-blue-tint)"
          />,
        ],
      ] as [string, ReactNode][])
      : []),
    ...(ModalityRow ? ([[t.benchmark.modality, ModalityRow]] as [string, ReactNode][]) : []),
    ...(TaskTypeRow ? ([[t.benchmark.taskType, TaskTypeRow]] as [string, ReactNode][]) : []),
    ...(domainLabels.length > 0
      ? ([
        [
          t.benchmark.domain,
          <TagList
            key="domains"
            items={domainLabels}
            color="var(--tag-domain-fg)"
            bg="var(--tag-domain-bg)"
          />,
        ],
      ] as [string, ReactNode][])
      : []),
    ...(subdomainLabels.length > 0
      ? ([
        [
          t.benchmark.subdomain,
          <TagList
            key="subdomains"
            items={subdomainLabels}
            color="var(--tag-domain-fg)"
            bg="var(--tag-domain-bg)"
          />,
        ],
      ] as [string, ReactNode][])
      : []),
    ...(LanguageRow ? ([[t.benchmark.language, LanguageRow]] as [string, ReactNode][]) : []),
    ...(DifficultyRow ? ([[t.benchmark.difficulty, DifficultyRow]] as [string, ReactNode][]) : []),
    [t.benchmark.size, Size],
    [t.benchmark.medianSize, MedianSize],
    ...(vm.confidenceScore !== undefined
      ? ([[t.benchmark.confidenceScore, PrimaryText(vm.confidenceScore)]] as [string, ReactNode][])
      : []),
    ...(vm.knowledgeLevel
      ? ([[t.benchmark.knowledgeLevel, PrimaryText(vm.knowledgeLevel)]] as [string, ReactNode][])
      : []),
    ...(vm.importance
      ? ([[t.benchmark.importance, PrimaryText(vm.importance)]] as [string, ReactNode][])
      : []),
    ...(vm.humanBaseline !== undefined
      ? ([[t.benchmark.humanBaseline, PrimaryText(vm.humanBaseline)]] as [string, ReactNode][])
      : []),
  ];

  const longSections: { label: string; text: string }[] = [];
  if (vm.humanBaselineNotes)
    longSections.push({ label: t.benchmark.humanBaselineNotes, text: vm.humanBaselineNotes });
  if (vm.evaluationLogic)
    longSections.push({ label: t.benchmark.evaluationLogic, text: vm.evaluationLogic });
  if (vm.recommendedMetricsDescription)
    longSections.push({
      label: t.benchmark.recommendedMetricsDescription,
      text: vm.recommendedMetricsDescription,
    });

  return (
    <div>
      <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
        {t.benchmark.overview}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between items-start gap-2 py-2 px-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <span
              className="text-xs flex-shrink-0"
              style={{ color: 'var(--text-secondary)', fontWeight: 500 }}
            >
              {label}
            </span>
            <div className="text-xs text-right">{value}</div>
          </div>
        ))}
      </div>

      {longSections.length > 0 && (
        <div className="space-y-4 mb-6">
          {longSections.map(({ label, text }) => (
            <div key={label} className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {label}
              </div>
              <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <DistBar label={t.benchmark.requestDist} dist={vm.requestLengthDist} unit={t.common.words} />
        <DistBar label={t.benchmark.responseDist} dist={vm.responseLengthDist} unit={t.common.words} />
      </div>

      {vm.capabilities.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            {t.benchmark.capabilities}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {vm.capabilities.map((cap) => (
              <div
                key={cap.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'var(--bg-blue-tint)',
                  border: '1px solid var(--accent)',
                }}
              >
                <span style={{ color: 'var(--text-blue-on-bg)' }}>{cap.label}</span>
                <CheckCircle size={13} style={{ color: 'var(--add-green-600)' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
