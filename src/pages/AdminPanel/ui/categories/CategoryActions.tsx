import { Pencil, Trash2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { isSuperUserRole } from '@/utils/auth/roles';
import type { BenchmarkSuite } from '@/types';

interface Props {
  category: BenchmarkSuite;
  onEdit: (c: BenchmarkSuite) => void;
  onDelete: (c: BenchmarkSuite) => void;
  labels: { edit: string; delete: string };
}

export const CategoryActions = ({ category, onEdit, onDelete, labels }: Props) => {
  const { userRole } = useApp();
  const canDelete = isSuperUserRole(userRole);

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(category)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <Pencil size={12} />
        <span className="hidden sm:inline">{labels.edit}</span>
      </button>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">{labels.delete}</span>
        </button>
      )}
    </div>
  );
};
