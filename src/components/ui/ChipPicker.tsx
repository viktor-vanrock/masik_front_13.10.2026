import type { ChipOption } from './chipOption';
import { resolveOption } from './chipOption';

interface ChipPickerProps {
  options: readonly ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export const ChipPicker = ({ options, selected, onToggle }: ChipPickerProps) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const { value, label } = resolveOption(opt);
        const isSelected = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className="text-xs px-2.5 py-1 rounded-lg transition-all"
            style={{
              backgroundColor: isSelected ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
              border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
              color: isSelected ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
            }}
          >
            {isSelected && '✓ '}
            {label}
          </button>
        );
      })}
    </div>
  );
};
