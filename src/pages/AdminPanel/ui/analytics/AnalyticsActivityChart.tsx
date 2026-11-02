import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '@/hooks/useApp';
import { useCssColors } from '@/hooks/useCssColors';
import type { AnalyticsChartRow } from './utils';

const CHART_COLOR_VARS = [
  '--accent',
  '--accent-secondary',
  '--success',
  '--warning',
  '--border',
  '--text-muted',
  '--bg-card',
  '--text-primary',
] as const;

interface Props {
  data: AnalyticsChartRow[];
  isLoading: boolean;
}

export function AnalyticsActivityChart({ data, isLoading }: Props) {
  const { t, lang } = useApp();
  const [
    benchmarkColor,
    benchmarkTestColor,
    searchColor,
    filterColor,
    gridColor,
    mutedColor,
    cardColor,
    primaryColor,
  ] = useCssColors(CHART_COLOR_VARS);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(`${value}T00:00:00`));

  return (
    <section
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t.admin.analytics.activityTitle}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {t.admin.analytics.activitySubtitle}
        </p>
      </div>

      {isLoading ? (
        <div className="h-[300px] rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
      ) : (
        <div className="h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: mutedColor, fontSize: 11 }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: mutedColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(value) => formatDate(String(value))}
                contentStyle={{
                  backgroundColor: cardColor,
                  border: `1px solid ${gridColor}`,
                  borderRadius: 10,
                  color: primaryColor,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Line
                type="monotone"
                dataKey="benchmarkTestViews"
                name={t.admin.analytics.benchmarkTestViews}
                stroke={benchmarkTestColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="benchmarkViews"
                name={t.admin.analytics.benchmarkViews}
                stroke={benchmarkColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="catalogSearches"
                name={t.admin.analytics.searches}
                stroke={searchColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="filterUsageEvents"
                name={t.admin.analytics.filters}
                stroke={filterColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
