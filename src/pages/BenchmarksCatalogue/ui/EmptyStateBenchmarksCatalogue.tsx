import { useApp } from '@/hooks/useApp';
import { Search } from 'lucide-react';

interface Props {
  onReset: () => void;
}

export function EmptyStateBenchmarksCatalogue({ onReset }: Props) {
  const { t } = useApp();

  const title= t.catalogue.noResults;
  const hint= t.catalogue.noResultsHint;
  const resetLabel=t.catalogue.resetFilters;

  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-bg-card border border-border-default">
      <Search size={36} className="text-icon-empty mb-4" />
      <p className="font-medium mb-1 text-primary">{title}</p>
      <p className="text-sm mb-5 text-muted">{hint}</p>
      <button 
        onClick={onReset}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-accent hover:opacity-90 transition-opacity"
        style={{ color: 'var(--button-primary)', backgroundColor: 'var(--button-primary-bg)' }}
      >
        {resetLabel}
      </button>
    </div>
  );
}