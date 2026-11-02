import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: string;
}

export function AnalyticsMetricCard({ icon, label, value, hint }: Props) {
  return (
    <div
      className="rounded-xl p-4 min-w-0"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p
            className="text-2xl font-semibold mt-1 tabular-nums"
            style={{ color: 'var(--text-primary)' }}
          >
            {value.toLocaleString()}
          </p>
          {hint && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
              {hint}
            </p>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-blue-tint)',
            color: 'var(--accent)',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
