interface Props {
    label: string,
}

export const SectionDivider =({ label }: Props) => {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
    </div>
  );
}