import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { aggregateSuiteModelScore, benchmarkModelScore } from '../utils';
import { useApp } from '@/hooks/useApp';
import type { BenchmarkType } from '@/types';
import type { BarBreakdownRowsType, ModelAveragesType, visibleModelsType } from '../types';

interface Props {
  modelAverages: ModelAveragesType[];
  barBreakdownRows: BarBreakdownRowsType[];
  visibleModels: visibleModelsType[];
  bmMap: Map<string, BenchmarkType>;
  selectedBenchmarks: Set<string>;
  modelColors: string[];
  activeMetricId: string | null;
}

export const BarChartView = ({
  modelAverages,
  barBreakdownRows,
  visibleModels,
  bmMap,
  selectedBenchmarks,
  modelColors,
  activeMetricId,
}: Props) => {
  const { t } = useApp();

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h3 className="font-medium mb-5" style={{ color: 'var(--text-primary)' }}>{t.dashboard.barChart}</h3>
      
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={[...modelAverages]
            .filter((model): model is ModelAveragesType & { avg: number } => model.avg !== null)
            .sort((a, b) => b.avg - a.avg)}
          margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            angle={-20}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'var(--bg-elevated)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              fontSize: '12px' 
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            formatter={(val) => [`${Number(val).toFixed(1)}`, t.dashboard.averageScore]}
          />
          <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
            {modelAverages.map((m) => {
              const idx = visibleModels.findIndex((mo) => mo.id === m.id);
              return <Cell key={m.id} fill={modelColors[idx % modelColors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Per-benchmark breakdown */}
      <div className="mt-8">
        <h3 className="font-medium mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>
          {t.dashboard.barByBenchmarkAndSuite}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={barBreakdownRows.map((row) => {
              const label = row.displayName.slice(0, 14) + (row.displayName.length > 14 ? '…' : '');
              const entry: Record<string, string | number> = { name: label };
              visibleModels.forEach((m) => {
                if (row.isSuite && row.suite) {
                  entry[m.id] =
                    aggregateSuiteModelScore(
                      row.suite,
                      bmMap,
                      selectedBenchmarks,
                      m.id,
                      activeMetricId
                    ) ?? 0;
                } else if (row.b) {
                  entry[m.id] = benchmarkModelScore(row.b, m.id, activeMetricId) ?? 0;
                }
              });
              return entry;
            })}
            margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                fontSize: '11px' 
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Legend wrapperStyle={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              paddingTop: '12px' 
            }} />
            {visibleModels.map((m, i) => (
              <Bar
                key={m.id}
                dataKey={m.id}
                name={m.name}
                fill={modelColors[i % modelColors.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
