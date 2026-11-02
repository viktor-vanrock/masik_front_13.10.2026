interface QuickReplyBarProps {
  labels: string[];
  onPick: (text: string) => void;
  disabled: boolean;
}

export function QuickReplyBar({ labels, onPick, disabled }: QuickReplyBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onPick(label)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--bg-blue-tint)',
            color: 'var(--text-blue-on-bg)',
            border: '1px solid var(--border)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}