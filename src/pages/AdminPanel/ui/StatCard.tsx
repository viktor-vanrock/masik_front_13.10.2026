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
      ? 'var(--admin-warning-bg)'
      : 'var(--bg-card)';

  const border = accent
    ? 'var(--accent)'
    : warning
      ? 'var(--admin-warning-border)'
      : 'var(--border)';

  const textColor = accent
    ? 'var(--text-blue-on-bg)'
    : warning
      ? 'var(--admin-warning-ink)'
      : 'var(--text-primary)';

  const iconColor = accent
    ? 'var(--accent)'
    : warning
      ? 'var(--admin-warning-ink)'
      : 'var(--text-muted)';

  return (
    <div
      className="flex min-h-[108px] items-start gap-3 rounded-[24px] p-5 max-[700px]:min-h-24 max-[700px]:p-4 [&_p:first-child]:text-[36px]! [&_p:first-child]:font-medium! [&_p:first-child]:tracking-[-.02em] [&_p:last-child]:mt-2 [&_p:last-child]:text-[14px]! max-[700px]:[&_p:first-child]:text-[28px]!"
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
