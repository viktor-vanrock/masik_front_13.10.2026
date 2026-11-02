import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';
import type { BenchmarkType } from '@/types';

import { ScoreCell } from './ScoreCell';
import { HumanScoreBadge } from './HumanScoreBadge';
import type { visibleModelsType } from '../../types';
import { calculateAverage, calculateMaxScore } from './utils';

interface Props {
  benchmark: BenchmarkType;
  humanScore?: number;
  visibleModels: visibleModelsType[];
  scoreMatrix: Record<string, Record<string, number | null>>;
}

export const SuiteMemberRow = ({ benchmark, humanScore, visibleModels, scoreMatrix }: Props) => {
  const { lang } = useApp();
  const displayName = lang === 'en' ? benchmark.nameEn : benchmark.name;
  
  const rowScores = visibleModels
    .map((model) => scoreMatrix[benchmark.id]?.[model.id])
    .filter((score): score is number => score != null);
  
  const average = calculateAverage(rowScores);
  const maxScore = calculateMaxScore(rowScores);

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td
        className="py-2.5 px-4 pl-10 sticky left-0"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              to={`/benchmark/${benchmark.id}`}
              className="hover:underline text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {displayName}
            </Link>
            {benchmark.metrics.length > 0 && (
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {benchmark.metrics.join(', ')}
              </p>
            )}
          </div>
          {humanScore !== undefined && <HumanScoreBadge score={humanScore} />}
        </div>
      </td>
      
      <td className="py-2.5 px-3 text-left text-xs" style={{ color: 'var(--text-muted)' }}>
        {average != null ? average.toFixed(1) : '—'}
      </td>
      
      {visibleModels.map((model) => {
        const score = scoreMatrix[benchmark.id]?.[model.id];
        const isBest = score != null && score === maxScore;
        
        return (
          <td key={model.id} className="py-2.5 px-3 text-left">
            <ScoreCell score={score} isBest={isBest} size="small" />
          </td>
        );
      })}
    </tr>
  );
};
