import { useMemo, useState } from 'react';
import { User } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { BenchmarkType, MetricDefinition, MetricResult } from '@/types';
import { useApp } from '@/hooks/useApp';
import { useCssColors } from '@/hooks/useCssColors';

const SCORE_COLORS = [
  '--add-blue-900',
  '--add-blue-600',
  '--add-blue-300',
  '--add-red-600',
  '--add-red-300',
  '--add-green-300',
  '--blue-700',
] as const;

interface Props {
  benchmark: BenchmarkType;
  results: MetricResult[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

interface MetricOption {
  key: string;
  label: string;
  definition?: MetricDefinition;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
}

function latestResults(results: MetricResult[]): MetricResult[] {
  const latest = new Map<string, MetricResult>();

  for (const result of results) {
    const key = `${result.metricId}:${result.modelId}`;
    const current = latest.get(key);
    if (!current || new Date(result.obtainedAt).getTime() > new Date(current.obtainedAt).getTime()) {
      latest.set(key, result);
    }
  }

  return [...latest.values()];
}

function chartDomain(metric: MetricDefinition | undefined, values: number[]): [number, number] {
  const observedMin = values.length > 0 ? Math.min(...values) : 0;
  const observedMax = values.length > 0 ? Math.max(...values) : 100;
  const min = metric?.minValue ?? Math.min(0, observedMin);
  const fallbackMax = observedMax <= 100 && observedMin >= 0 ? 100 : observedMax;
  const max = metric?.maxValue ?? fallbackMax;
  return min === max ? [min, min + 1] : [min, max];
}

export function ScoresTab({ benchmark, results, isPending, isError, error, onRetry }: Props) {
  const scoreColors = useCssColors(SCORE_COLORS);
  const { t } = useApp();
  const [selectedMetricKey, setSelectedMetricKey] = useState('');

  const currentResults = useMemo(
    () => latestResults(results),
    [results],
  );

  const metricOptions = useMemo<MetricOption[]>(() => {
    const options = new Map<string, MetricOption>();

    for (const result of currentResults) {
      options.set(result.metricId, {
        key: result.metricId,
        label: result.metric.displayName || result.metric.name,
        definition: result.metric,
      });
    }

    const resultMetricNames = new Set(
      currentResults.flatMap((result) => [result.metric.name, result.metric.displayName ?? ''])
        .map((name) => name.toLocaleLowerCase()),
    );
    for (const name of benchmark.metrics) {
      if (!resultMetricNames.has(name.toLocaleLowerCase())) {
        options.set(`name:${name}`, { key: `name:${name}`, label: name });
      }
    }

    return [...options.values()];
  }, [benchmark.metrics, currentResults]);

  const activeMetricKey = metricOptions.some((option) => option.key === selectedMetricKey)
    ? selectedMetricKey
    : (metricOptions[0]?.key ?? '');
  const activeMetric = metricOptions.find((option) => option.key === activeMetricKey);
  const metricResults = currentResults.filter((result) => result.metricId === activeMetricKey);
  const isLowerBetter = activeMetric?.definition?.direction.code === 'lower_is_better';
  const humanBaseline = benchmark.humanBaseline;
  const modelResults = metricResults
    .filter((result) => result.modelId !== 'human')
    .sort((left, right) =>
      isLowerBetter ? left.value - right.value : right.value - left.value,
    );
  const domain = chartDomain(activeMetric?.definition, metricResults.map((result) => result.value));

  if (isPending) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {t.benchmark.metricResultsLoading}
      </p>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
          {error instanceof Error ? error.message : t.benchmark.metricResultsError}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          {t.catalogue.retry}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            {t.benchmark.scores}
          </h2>
          {activeMetric?.definition && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {isLowerBetter ? t.benchmark.lowerIsBetter : t.benchmark.higherIsBetter}
            </p>
          )}
        </div>

        {metricOptions.length > 1 && (
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.benchmark.metricSelectLabel}
            <select
              value={activeMetricKey}
              onChange={(event) => setSelectedMetricKey(event.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {metricOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        )}

        {humanBaseline !== undefined && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--human-pill-bg)', border: '1px solid var(--human-pill-border)', color: 'var(--human-pill-text)' }}
          >
            <User size={12} />
            {t.benchmark.humanBaseline}: {humanBaseline.toFixed(2)}
          </div>
        )}
      </div>

      {metricOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {metricOptions.map((option) => (
            <button
              type="button"
              key={option.key}
              onClick={() => setSelectedMetricKey(option.key)}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: option.key === activeMetricKey ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
                color: option.key === activeMetricKey ? 'var(--text-blue-on-bg)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {metricResults.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {t.benchmark.noMetricResults}
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              {activeMetric?.label}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modelResults} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="model.name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={domain} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                />
                {humanBaseline !== undefined && (
                  <ReferenceLine
                    y={humanBaseline}
                    stroke="var(--human-accent)"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    label={{ value: `${t.benchmark.humanShort} ${humanBaseline.toFixed(2)}`, fill: 'var(--human-accent)', fontSize: 11, position: 'insideTopRight' }}
                  />
                )}
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {modelResults.map((result, index) => (
                    <Cell key={result.id} fill={scoreColors[index % scoreColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>#</th>
                  <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.benchmark.model}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.benchmark.typeLabel}</th>
                  <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.benchmark.obtainedAtCol}</th>
                  <th className="text-right py-2 px-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{activeMetric?.label}</th>
                </tr>
              </thead>
              <tbody>
                {modelResults.map((result, index) => (
                  <tr key={result.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>{result.model.name}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{result.model.isOpenSource ? t.benchmark.openSource : t.benchmark.proprietary}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(result.obtainedAt)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{result.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
