import { useApp } from '@/hooks/useApp';
import type { DashboardMetricOption } from '../types';

interface Props {
  metrics: DashboardMetricOption[];
  activeMetricId: string | null;
  onChange: (metricId: string) => void;
}

export const MetricFilter = ({ metrics, activeMetricId, onChange }: Props) => {
  const { t } = useApp();

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
        htmlFor="dashboard-metric"
      >
        {t.dashboard.metricFilter}
      </label>
      {metrics.length > 0 ? (
        <select
          id="dashboard-metric"
          value={activeMetricId ?? ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg px-2.5 py-2 text-xs"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {metrics.map((metric) => (
            <option key={metric.id} value={metric.id}>
              {metric.label}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {t.dashboard.noMetrics}
        </p>
      )}
    </div>
  );
};
