interface CapabilityChipsProps {
  label: string;
  capabilities: Array<{ label: string; value: boolean; onChange: (val: boolean) => void }>;
}

export function CapabilityChips({ label, capabilities }: CapabilityChipsProps) {
  return (
    <div>
      <label 
        className="block text-xs mb-2 font-medium" 
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {capabilities.map(({ label, value, onChange }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(!value)}
            className="text-xs px-2.5 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: value ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
              color: value ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
              border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}