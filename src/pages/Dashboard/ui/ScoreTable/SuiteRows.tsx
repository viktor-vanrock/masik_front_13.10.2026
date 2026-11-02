import type { BenchmarkType } from '@/types';
import type { DashboardTopRow, visibleModelsType } from "../../types";
import { SuiteHeaderRow } from "./SuiteHeaderRow";
import { SuiteMemberRow } from "./SuiteMemberRow";

export const SuiteRows = (
  row: DashboardTopRow & { kind: 'suite' },
  visibleModels: visibleModelsType[],
  scoreMatrix: Record<string, Record<string, number | null>>,
  expandedSuites: Set<string>,
  toggleExpandedSuite: (id: string) => void,
  selectedBenchmarks: Set<string>,
  bmMap: Map<string, BenchmarkType>,
  activeMetricId: string | null
) => {
  const { suite } = row;
  const expanded = expandedSuites.has(suite.id);

  const header = (
    <SuiteHeaderRow
      key={`suite-${suite.id}`}
      suiteId={suite.id}
      displayName={row.displayName}
      isExpanded={expanded}
      onToggle={() => toggleExpandedSuite(suite.id)}
      visibleModels={visibleModels}
      scoreMatrix={scoreMatrix}
      bmMap={bmMap}
      selectedBenchmarks={selectedBenchmarks}
      row={row}
      activeMetricId={activeMetricId}
    />
  );

  if (!expanded) return [header];

  const memberRows = suite.testIds
    .filter((id) => selectedBenchmarks.has(id))
    .map((id) => {
      const benchmark = bmMap.get(id);
      if (!benchmark) return null;
      
      return (
        <SuiteMemberRow
          key={benchmark.id}
          benchmark={benchmark}
          humanScore={benchmark.humanBaseline}
          visibleModels={visibleModels}
          scoreMatrix={scoreMatrix}
        />
      );
    })
    .filter((el): el is React.ReactElement => el != null);

  return [header, ...memberRows];
}
