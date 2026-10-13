import { CalendarDays, RefreshCw } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

interface Props {
  from: string;
  to: string;
  activePreset: number | null;
  isRefreshing: boolean;
  onPresetChange: (days: number) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRefresh: () => void;
}

const PRESETS = [7, 30, 90] as const;

export function AnalyticsDateRange({
  from,
  to,
  activePreset,
  isRefreshing,
  onPresetChange,
  onFromChange,
  onToChange,
  onRefresh,
}: Props) {
  const { t } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--accent)' }}
        >
          <CalendarDays size={15} />
        </div>
        {PRESETS.map((days) => {
          const isActive = activePreset === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => onPresetChange(days)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--nav-blue-bg)' : 'var(--bg-elevated)',
                color: isActive ? 'var(--text-blue-on-bg)' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {t.admin.analytics.lastDays.replace('{count}', String(days))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{t.admin.analytics.from}</span>
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(event) => onFromChange(event.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{t.admin.analytics.to}</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(event) => onToChange(event.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </label>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
          }}
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {t.admin.analytics.refresh}
        </button>
      </div>
    </div>
  );
}
