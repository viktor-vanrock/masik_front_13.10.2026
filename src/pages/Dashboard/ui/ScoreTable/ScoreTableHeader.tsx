import type { ColSort, visibleModelsType } from '../../types';
import { useApp } from '@/hooks/useApp';
import { SortButton } from '../SortButton';

interface Props {
  visibleModels: visibleModelsType[];
  modelColors: string[];
  sort: ColSort;
  onSort: (col: string) => void;
}

export const ScoreTableHeader = ({ visibleModels, modelColors, sort, onSort }: Props) => {
  const { t } = useApp();

  return (
    <thead>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <th
          className="text-left py-3 px-4 font-medium sticky left-0"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-card)',
            minWidth: 240,
          }}
        >
          <SortButton label={t.dashboard.benchmark} col="name" sort={sort} onSort={onSort} />
        </th>
        <th
          className="text-right py-3 px-3 font-medium"
          style={{ color: 'var(--text-muted)', minWidth: 60 }}
        >
          {t.dashboard.average}
        </th>
        {visibleModels.map((model, index) => (
          <th
            key={model.id}
            className="text-right py-3 px-3 font-medium"
            style={{ color: modelColors[index % modelColors.length], minWidth: 90 }}
          >
            <SortButton label={model.name} col={model.id} sort={sort} onSort={onSort} />
          </th>
        ))}
      </tr>
    </thead>
  );
};
