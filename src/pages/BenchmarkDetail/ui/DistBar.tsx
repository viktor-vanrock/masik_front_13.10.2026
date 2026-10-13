interface Props {
  label: string;
  dist: { min: number; median: number; max: number };
  unit: string;
}

export function DistBar({ label, dist, unit }: Props) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <div className="flex justify-between text-xs" style={{ color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="font-semibold">{dist.min.toLocaleString()}</div>
          <div style={{ color: 'var(--text-muted)' }}>min</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{dist.median.toLocaleString()}</div>
          <div style={{ color: 'var(--text-muted)' }}>median</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{dist.max.toLocaleString()}</div>
          <div style={{ color: 'var(--text-muted)' }}>max</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-right" style={{ color: 'var(--text-secondary)' }}>{unit}</div>
    </div>
  );
}