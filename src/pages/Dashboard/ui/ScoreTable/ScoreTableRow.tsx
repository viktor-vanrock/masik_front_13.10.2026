import { Link } from 'react-router-dom';
import { ScoreCell } from './ScoreCell';
import { HumanScoreBadge } from './HumanScoreBadge';
import { RowAverage } from './RowAverage';
import { calculateMaxScore } from './utils';
import type { visibleModelsType } from '../../types';

interface Props {
  benchmarkId: string;
  displayName: string;
  metrics: string[];
  humanScore?: number;
  visibleModels: visibleModelsType[];
  scoreMatrix: Record<string, Record<string, number | null>>;
  rowType: 'standalone' | 'suite-member';
}

export const ScoreTableRow = ({
  benchmarkId,
  displayName,
  metrics,
  humanScore,
  visibleModels,
  scoreMatrix,
  rowType,
}: Props) => {

  const rowScores = visibleModels
    .map((model) => scoreMatrix[benchmarkId]?.[model.id])
    .filter((score): score is number => score != null);
  
  const maxScore = calculateMaxScore(rowScores);
  
  const isStandalone = rowType === 'standalone';
  const cellPadding = isStandalone ? 'py-3 px-4' : 'py-2.5 px-4 pl-10';
  const textSize = isStandalone ? 'text-xs' : 'text-xs';

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td
        className={`${cellPadding} sticky left-6 flex`}
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="min-w-0 flex-1">
          <Link
            to={`/benchmark/${benchmarkId}`}
            className={`hover:underline ${textSize}`}
            style={{ color: isStandalone ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {displayName}
          </Link>
          {metrics.length > 0 && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {metrics.join(', ')}
            </p>
          )}
        </div>
        {humanScore !== undefined && <HumanScoreBadge score={humanScore} />}
      </td>
      
      <RowAverage scores={rowScores} />
      
      {visibleModels.map((model) => {
        const score = scoreMatrix[benchmarkId]?.[model.id];
        const isBest = score != null && score === maxScore;
        
        return (
          <td key={model.id} className="py-3 px-3 text-left">
            <ScoreCell score={score} isBest={isBest} size={isStandalone ? 'normal' : 'small'} />
          </td>
        );
      })}
    </tr>
  );
};
