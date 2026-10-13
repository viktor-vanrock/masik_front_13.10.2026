import { Search, X } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChange, placeholder }: Props) {
  const { t } = useApp();
  return (
    <div className="relative mb-4">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-lg text-sm
                   bg-bg-input border border-border-default text-primary
                   outline-none focus:border-accent transition-colors
                   placeholder:text-muted"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 
                     text-muted hover:text-primary transition-colors"
          aria-label={t.common.aria.clearSearch}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}