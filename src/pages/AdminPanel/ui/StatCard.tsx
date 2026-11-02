export function StatCard({ 
  icon, 
  label, 
  value, 
  accent, 
  warning 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  accent?: boolean; 
  warning?: boolean; 
}) {
  const bg = accent 
    ? 'var(--bg-blue-tint)' 
    : warning 
      ? '#FFFBEB' 
      : 'var(--bg-card)';
    
  const border = accent 
    ? 'var(--accent)' 
    : warning 
      ? '#FCD34D' 
      : 'var(--border)';
    
  const textColor = accent 
    ? 'var(--text-blue-on-bg)' 
    : warning 
      ? '#92400E' 
      : 'var(--text-primary)';
    
  const iconColor = accent 
    ? 'var(--accent)' 
    : warning 
      ? '#D97706' 
      : 'var(--text-muted)';

  return (
    <div 
      className="flex items-center gap-3 p-4 rounded-xl" 
      style={{ 
        backgroundColor: bg, 
        border: `1px solid ${border}` 
      }}
    >
      <div style={{ color: iconColor }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p 
          className="text-lg font-bold leading-none" 
          style={{ color: textColor }}
        >
          {value}
        </p>
        <p 
          className="text-xs mt-0.5 truncate" 
          style={{ color: textColor, opacity: 0.8 }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}