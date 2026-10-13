import type { BenchmarkType } from '@/types';
import { ModelAveragesSummary } from './ModelAveragesSummary';
import { ScoreTableHeader } from './ScoreTableHeader';
import type { ColSort, DashboardTopRow, ModelAveragesType, visibleModelsType } from '../../types';
import { StandaloneRow } from './StandaloneRow';
import { SuiteRows } from './SuiteRows';

interface Props {
  orderedTopRows: DashboardTopRow[];
  visibleModels: visibleModelsType[];
  modelColors: string[];
  scoreMatrix: Record<string, Record<string, number | null>>;
  expandedSuites: Set<string>;
  toggleExpandedSuite: (id: string) => void;
  selectedBenchmarks: Set<string>;
  bmMap: Map<string, BenchmarkType>;
  sort: ColSort;
  handleSort: (col: string) => void;
  modelAverages: ModelAveragesType[];
  activeMetricId: string | null;
}

export const ScoreTable = ({
  orderedTopRows,
  visibleModels,
  modelColors,
  scoreMatrix,
  expandedSuites,
  toggleExpandedSuite,
  selectedBenchmarks,
  bmMap,
  sort,
  handleSort,
  modelAverages,
  activeMetricId,
}: Props) => {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <ModelAveragesSummary
        modelAverages={modelAverages}
        visibleModels={visibleModels}
        modelColors={modelColors}
      />
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <ScoreTableHeader
            visibleModels={visibleModels}
            modelColors={modelColors}
            sort={sort}
            onSort={handleSort}
          />
          
          <tbody>
            {orderedTopRows.flatMap((row) =>
              row.kind === 'standalone'
                ? StandaloneRow(row, visibleModels, scoreMatrix)
                : SuiteRows(
                  row,
                  visibleModels,
                  scoreMatrix,
                  expandedSuites,
                  toggleExpandedSuite,
                  selectedBenchmarks,
                  bmMap,
                  activeMetricId
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
