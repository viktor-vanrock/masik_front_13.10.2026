import { Search, Check } from "lucide-react";
import { useState } from "react";
import { useApp } from '@/hooks/useApp';
import type { ChipOption } from './chipOption';
import { resolveOption } from './chipOption';

interface SearchableChipPickerProps {
  options: readonly ChipOption[];
  selected: string[];
  onToggle: (v: string, isSelected: boolean) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export const SearchableChipPicker = ({
  options,
  selected,
  onToggle,
  placeholder,
  emptyMessage,
}: SearchableChipPickerProps) => {
  const { t } = useApp();
  const [query, setQuery] = useState('');
  const resolvedPlaceholder = placeholder ?? t.common.search;
  const resolvedEmpty = emptyMessage ?? t.common.nothingFound;

  const filtered = query
    ? options.filter((o) => resolveOption(o).label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div>
      <div className="relative mb-2">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={resolvedPlaceholder}
          className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs"
          style={{
            backgroundColor: 'var(--bg-page)',
            border: '1px solid var(--border)',
            outline: 'none',
            color: 'var(--text-primary)',
          }}
        />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((val) => {
            const opt = options.find((o) => resolveOption(o).value === val);
            const label = opt ? resolveOption(opt).label : val;
            return (
              <span
                key={val}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--text-blue-on-bg)' }}
              >
                {label}
                <button onClick={() => onToggle(val, false)} style={{ color: 'var(--accent)' }}>
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div
        className="max-h-48 overflow-y-auto rounded-lg p-1"
        style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}
      >
        {filtered.length === 0 ? (
          <p className="text-xs px-2 py-2" style={{ color: 'var(--border-strong)' }}>{resolvedEmpty}</p>
        ) : (
          filtered.map((opt) => {
            const { value, label } = resolveOption(opt);
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onToggle(value, !isSelected)}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--bg-blue-tint)' : 'transparent',
                  color: isSelected ? 'var(--text-blue-on-bg)' : 'var(--text-secondary)',
                }}
              >
                <span
                  className="w-3 h-3 rounded flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                    backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {isSelected && <Check size={7} color="#fff" strokeWidth={3} />}
                </span>
                {label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
