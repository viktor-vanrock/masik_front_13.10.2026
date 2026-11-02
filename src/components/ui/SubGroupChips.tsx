interface SubGroupChipsProps {
  label: string;
  availableGroups: string[];
  selectedGroups: string[];
  onToggle: (group: string) => void;
}

export function SubGroupChips({ 
  label, 
  availableGroups, 
  selectedGroups, 
  onToggle 
}: SubGroupChipsProps) {
  if (availableGroups.length === 0) return null;

  return (
    <div>
      <label 
        className="block text-xs mb-2 font-medium" 
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {availableGroups.map((sg) => {
          const isSelected = selectedGroups.includes(sg);
          return (
            <button
              key={sg}
              type="button"
              onClick={() => onToggle(sg)}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: isSelected ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
                color: isSelected ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {sg}
            </button>
          );
        })}
      </div>
    </div>
  );
}