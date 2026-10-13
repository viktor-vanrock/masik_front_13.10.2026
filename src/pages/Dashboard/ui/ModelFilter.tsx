import { useApp } from '@/hooks/useApp';
import type { MetricModel } from '@/types';

interface Props {
  selectedModels: Set<string>;
  models: MetricModel[];
  toggleModel: (id: string) => void;
  modelColors: string[];
}

export const ModelFilter = ({ selectedModels, models, toggleModel, modelColors }: Props) => {
  const { t } = useApp();
  
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        {t.dashboard.modelFilter}
      </p>
      <div className="space-y-1.5">
        {models.map((m, i) => (
          <button
            key={m.id}
            onClick={() => toggleModel(m.id)}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs transition-colors"
            style={{
              backgroundColor: selectedModels.has(m.id) ? 'var(--bg-blue-tint)' : 'transparent',
              color: selectedModels.has(m.id) ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedModels.has(m.id) ? modelColors[i % modelColors.length] : 'var(--border-strong)' }}
            />
            <span className="truncate">{m.name}</span>
            <span
              className="ml-auto text-xs flex-shrink-0"
              style={{ color: m.isOpenSource ? 'var(--text-blue-on-bg)' : 'var(--accent-secondary)' }}
            >
              {m.isOpenSource ? t.dashboard.openSourceShort : t.dashboard.proprietaryShort}
            </span>
          </button>
        ))}
        {models.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.dashboard.noModels}
          </p>
        )}
      </div>
    </div>
  );
}
