interface Props {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}

export const TriStateToggle = ({
  label,
  value,
  onChange,
}: Props ) => {
  const cycle = () => {
    if (value === true) onChange(null);
    else onChange(true);
  };

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all"
      style={{
        backgroundColor: value === null ? 'var(--bg-elevated)' : value ? 'var(--bg-blue-tint)' : 'var(--badge-red-bg)',
        border: `1px solid ${value === null ? 'transparent' : value ? 'var(--accent)' : 'var(--danger)'}`,
        color: value === null ? 'var(--text-secondary)' : value ? 'var(--text-blue-on-bg)' : 'var(--danger)',
        cursor: 'pointer',
      }}
    >
      {value !== null && (
        <span className="font-bold" style={{ fontSize: '10px' }}>
          {value ? '✓' : '✗'}
        </span>
      )}
      {label}
    </button>
  );
}