import type { ModelAveragesType, visibleModelsType } from "../../types";

interface Props {
  modelAverages: ModelAveragesType[];
  visibleModels: visibleModelsType[];
  modelColors: string[];
}

export const ModelAveragesSummary = ({ modelAverages, visibleModels, modelColors }: Props) => {
  const sortedAverages = [...modelAverages].sort(
    (a, b) => (b.avg ?? Number.NEGATIVE_INFINITY) - (a.avg ?? Number.NEGATIVE_INFINITY),
  );

  return (
    <div
      className="px-4 py-3 flex gap-3 flex-wrap"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {sortedAverages.map((model) => {
        const colorIndex = visibleModels.findIndex((m) => m.id === model.id) % modelColors.length;
        
        return (
          <div key={model.id} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: modelColors[colorIndex] }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{model.name}</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {model.avg === null ? '—' : model.avg.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
