// src/components/ui/SearchInput.tsx
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  containerClassName?: string;
  inputClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  containerClassName,
  inputClassName,
}: SearchInputProps) {
  const handleClear = () => onChange('');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
  };

  return (
    <div className={`relative ${containerClassName ?? 'mb-4'}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)' }}
      />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full rounded-lg pl-9 pr-9 text-sm ${inputClassName ?? 'py-2.5'}`}
        style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border)',
          outline: 'none',
          color: 'var(--text-primary)',
        }}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
          aria-label="Clear search"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}