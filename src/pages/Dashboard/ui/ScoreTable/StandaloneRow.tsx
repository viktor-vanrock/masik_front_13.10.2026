import type { DashboardTopRow, visibleModelsType } from "../../types";
import { ScoreTableRow } from "./ScoreTableRow";

export const StandaloneRow = (
  row: DashboardTopRow & { kind: 'standalone' },
  visibleModels: visibleModelsType[],
  scoreMatrix: Record<string, Record<string, number | null>>,
) => {
  const b = row.b;
  
  return [
    <ScoreTableRow
      key={b.id}
      benchmarkId={b.id}
      displayName={row.displayName}
      metrics={b.metrics}
      humanScore={b.humanBaseline}
      visibleModels={visibleModels}
      scoreMatrix={scoreMatrix}
      rowType="standalone"
    />
  ];
}
