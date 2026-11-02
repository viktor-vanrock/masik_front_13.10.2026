import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ColSort } from '../types';

interface SortButtonProps {
  label: string;
  col: string;
  sort: ColSort;
  onSort: (col: string) => void;
}

export function SortButton({ label, col, sort, onSort }: SortButtonProps) {
  const active = sort.col === col;
  
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ color: active ? 'var(--text-primary)' : 'inherit' }}
    >
      {label}
      {active ? (
        sort.dir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />
      ) : (
        <ArrowUpDown size={11} style={{ opacity: 0.4 }} />
      )}
    </button>
  );
}