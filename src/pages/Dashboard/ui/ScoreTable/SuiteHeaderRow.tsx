import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import type { BenchmarkType } from '@/types';
import { ScoreCell } from './ScoreCell';
import { aggregateSuiteModelScore } from '../../utils';
import type { DashboardTopRow, visibleModelsType } from '../../types';

interface Props {
  suiteId: string;
  displayName: string;
  isExpanded: boolean;
  onToggle: () => void;
  visibleModels: visibleModelsType[];
  scoreMatrix: Record<string, Record<string, number | null>>;
  bmMap: Map<string, BenchmarkType>;
  selectedBenchmarks: Set<string>;
  row: DashboardTopRow & { kind: 'suite' },
  activeMetricId: string | null;
}

export const SuiteHeaderRow = ({
  displayName,
  isExpanded,
  onToggle,
  visibleModels,
  bmMap,
  selectedBenchmarks,
  row,
  activeMetricId,
}: Props) => {
  const { t } = useApp();
  const { suite } = row;
  
  if (!suite) return null;
  
  const suiteScores = visibleModels
    .map((model) =>
      aggregateSuiteModelScore(
        suite,
        bmMap,
        selectedBenchmarks,
        model.id,
        activeMetricId
      )
    )
    .filter((score): score is number => score != null);
  
  const suiteAvg = suiteScores.length > 0
    ? suiteScores.reduce((sum, score) => sum + score, 0) / suiteScores.length
    : null;
  
  const suiteMax = suiteScores.length > 0 ? Math.max(...suiteScores) : null;

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-elevated)',
      }}
    >
      <td className="py-3 px-4 sticky left-0" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="p-0.5 rounded"
            style={{ color: 'var(--text-muted)' }}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-blue-tint)',
              color: 'var(--text-blue-on-bg)',
            }}
          >
            {t.dashboard.suiteAggregate}
          </span>
        </div>
        <p className="text-[10px] mt-1 pl-6" style={{ color: 'var(--text-muted)' }}>
          {isExpanded ? t.dashboard.hideSuiteMembers : t.dashboard.showSuiteMembers}
        </p>
      </td>
      
      <td className="py-3 px-3 text-left font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {suiteAvg != null ? suiteAvg.toFixed(1) : '—'}
      </td>
      
      {visibleModels.map((model) => {
        const score = aggregateSuiteModelScore(
          suite,
          bmMap,
          selectedBenchmarks,
          model.id,
          activeMetricId
        );
        const isBest = score != null && score === suiteMax;
        
        return (
          <td key={model.id} className="py-3 px-3 text-left">
            <ScoreCell score={score} isBest={isBest} />
          </td>
        );
      })}
    </tr>
  );
};
