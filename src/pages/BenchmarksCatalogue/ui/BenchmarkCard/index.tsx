import { Link } from 'react-router-dom';
import {
  Globe,
  Tag,
  Database,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutGrid,
  Copy,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import { getColorByName } from '../../utils';
import { CardTags } from './CardTags';
import { CardMetaTag } from './CardMetaTag';
import { CardCapBadge } from './CardCapBadge';

interface Props {
  benchmark: BenchmarkType;
}

export const BenchmarkCard = ({ benchmark }: Props) => {
  const { lang, t } = useApp();
  const [copied, setCopied] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [charsExpanded, setCharsExpanded] = useState(false);
  const vm = useMemo(
    () => selectBenchmarkTestVM(benchmark, lang),
    [benchmark, lang],
  );

  const macroGroupLabel = vm.macroGroup?.label ?? '';
  const accentColor = getColorByName(macroGroupLabel) || 'var(--accent)';

  const description = vm.shortDescription || vm.displayDescription;
  const isDescriptionTruncatable = description.length > 100;

  function toggleDescription(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDescriptionExpanded((v) => !v);
  }

  const launchCmd = vm.gigaMetricLaunchCommand;
  const setUrl = vm.gigaMetricSetUrl;

  async function copyLaunchCode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!launchCmd) return;
    try {
      await navigator.clipboard.writeText(launchCmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function openSet(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (setUrl) window.open(setUrl, '_blank', 'noopener,noreferrer');
  }

  const subGroupLabels = vm.subGroups.map((g) => g.label);
  const abilityTaxonLabels = vm.abilityTaxons.map((a) => a.label);
  const domainLabels = vm.domains.map((d) => d.label);
  const CHARS_MAX_VISIBLE = 2;
  const hasTruncatedChars = [subGroupLabels, abilityTaxonLabels, domainLabels]
    .some((labels) => labels.length > CHARS_MAX_VISIBLE);
  const charsMaxVisible = charsExpanded ? Infinity : CHARS_MAX_VISIBLE;

  function toggleChars(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCharsExpanded((v) => !v);
  }

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 group"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {vm.macroGroup && (
              <div className="w-full">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--badge-red)',
                    color: 'var(--badge-red)',
                  }}
                >
                  {vm.macroGroup.label}
                </span>
              </div>
            )}
            {vm.datasetSubsamples.length > 0 && (
              <span
                className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--bg-blue-tint)',
                  color: 'var(--text-secondary)',
                }}
              >
                <LayoutGrid size={10} />
                {vm.datasetSubsamples.length} {t.common.subsamples}
              </span>
            )}
            {vm.validationStatus === 'validation' && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: 'var(--bg-blue-tint)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                }}
              >
                {t.admin.validationBadge}
              </span>
            )}
          </div>
          <Link to={`/benchmark/${vm.id}`}>
            <h3
              className="font-semibold text-base truncate transition-colors hover:underline text-left w-full"
              style={{ color: 'var(--text-primary)' }}
            >
              {vm.displayName}
            </h3>
          </Link>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p
          className={`text-sm leading-relaxed ${descriptionExpanded ? '' : 'line-clamp-2'}`}
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
        {isDescriptionTruncatable && (
          <button
            type="button"
            onClick={toggleDescription}
            className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {descriptionExpanded ? t.common.showLess : t.common.showMore}
            {descriptionExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Taxonomy arrays */}
      <div className="space-y-1.5 mb-3">
        {subGroupLabels.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Layers
              size={11}
              className="flex-shrink-0 mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            />
            <CardTags
              items={subGroupLabels}
              maxVisible={charsMaxVisible}
              color="var(--text-secondary)"
              bg="var(--bg-elevated)"
            />
          </div>
        )}
        {abilityTaxonLabels.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Tag
              size={11}
              className="flex-shrink-0 mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            />
            <CardTags
              items={abilityTaxonLabels}
              maxVisible={charsMaxVisible}
              color="var(--text-blue-on-bg)"
              bg="var(--bg-blue-tint)"
            />
          </div>
        )}
        {hasTruncatedChars && (
          <button
            type="button"
            onClick={toggleChars}
            className="inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            {charsExpanded ? t.common.hideCharacteristics : t.common.showAllCharacteristics}
            {charsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {vm.taskType && (
          <CardMetaTag
            icon={<span className="text-xs">{vm.taskType.label}</span>}
            plain
          />
        )}
        {vm.language && (
          <CardMetaTag icon={<Globe size={11} />} label={vm.language.label} />
        )}
        {vm.difficulty && (
          <CardMetaTag icon={<Tag size={11} />} label={vm.difficulty.label} />
        )}
        <CardMetaTag
          icon={<Database size={11} />}
          label={`${vm.sizeInSamples.toLocaleString()} ${t.common.samples}`}
        />
      </div>

      {/* Capabilities */}
      {vm.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {vm.capabilities.map((cap) => (
            <CardCapBadge key={cap.id} label={cap.label} />
          ))}
        </div>
      )}

      {/* Footer — domains + compact actions + link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 mr-2">
          <CardTags
            items={domainLabels}
            maxVisible={charsMaxVisible}
            color="var(--tag-domain-fg)"
            bg="var(--tag-domain-bg)"
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {(launchCmd || setUrl) && (
            <>
              {launchCmd && (
                <button
                  type="button"
                  onClick={copyLaunchCode}
                  className="inline-flex items-center justify-center p-1 rounded-md transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-elevated)',
                  }}
                  title={copied ? t.benchmark.copied : t.benchmark.copyLaunchCommand}
                >
                  <Copy size={13} />
                </button>
              )}
              {setUrl && (
                <button
                  type="button"
                  onClick={openSet}
                  className="inline-flex items-center justify-center p-1 rounded-md transition-colors"
                  style={{
                    color: 'var(--text-blue-on-bg)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-blue-tint)',
                  }}
                  title={t.benchmark.openInGitVerse}
                >
                  <ExternalLink size={13} />
                </button>
              )}
              <Link
                to="/guide"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center p-1 rounded-md transition-colors"
                style={{
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
                title={t.benchmark.seeGuide}
              >
                <BookOpen size={13} />
              </Link>
            </>
          )}
          <Link
            to={`/benchmark/${vm.id}`}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: accentColor }}
          >
            {t.common.viewDetails}
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
};
