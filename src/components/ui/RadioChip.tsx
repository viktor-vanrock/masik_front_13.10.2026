interface RadioChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export const RadioChip = ({ label, selected, onClick }: RadioChipProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all w-full"
      style={{
        backgroundColor: selected ? 'var(--bg-blue-tint)' : 'var(--bg-page)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        color: selected ? 'var(--text-blue-on-bg)' : 'var(--text-secondary)',
      }}
    >
      <span
        className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
          backgroundColor: selected ? 'var(--accent)' : 'transparent',
        }}
      >
        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
      </span>
      {label}
    </button>
  );
};