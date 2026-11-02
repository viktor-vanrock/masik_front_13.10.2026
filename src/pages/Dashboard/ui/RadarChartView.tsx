import { useApp } from '@/hooks/useApp';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import type { visibleModelsType } from '../types';

interface Props {
  radarData: Record<string, string | number>[];
  visibleModels: visibleModelsType[];
  modelColors: string[];
}

export function RadarChartView({
  radarData,
  visibleModels,
  modelColors,
}: Props) {
  const { t } = useApp();

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h3 className="font-medium mb-5" style={{ color: 'var(--text-primary)' }}>
        {t.dashboard.radarMacroAndSuites}
      </h3>
      
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="group"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
            axisLine={false}
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
          {visibleModels.map((m, i) => (
            <Radar
              key={m.id}
              name={m.name}
              dataKey={m.id}
              stroke={modelColors[i % modelColors.length]}
              fill={modelColors[i % modelColors.length]}
              fillOpacity={0.08}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text-muted)' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}