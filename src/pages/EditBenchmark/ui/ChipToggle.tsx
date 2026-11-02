interface ChipToggleProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function ChipToggle({ label, active, onToggle }: ChipToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-xs px-2.5 py-1 rounded-lg transition-colors"
      style={{
        backgroundColor: active ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
        color: active ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  );
}