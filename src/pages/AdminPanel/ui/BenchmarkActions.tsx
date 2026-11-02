import { Link } from 'react-router-dom';
import { Upload, Pencil, Trash2 } from 'lucide-react';
import type { BenchmarkType } from '@/types';
import { useApp } from '@/hooks/useApp';
import { isSuperUserRole } from '@/utils/auth/roles';

interface BenchmarkActionsProps {
  benchmark: BenchmarkType;
  onUpload: (benchmark: BenchmarkType) => void;
  onDelete: (benchmark: BenchmarkType) => void;
  labels: {
    upload: string;
    edit: string;
    delete: string;
  };
}

export function BenchmarkActions({
  benchmark,
  onUpload,
  onDelete,
  labels,
}: BenchmarkActionsProps) {
  const { userRole, t } = useApp();
  const canDelete = isSuperUserRole(userRole);

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => onUpload(benchmark)}
        title={t.admin.uploadResults}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-bg-hover transition-colors"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <Upload size={12} />
        <span className="hidden md:inline">{labels.upload}</span>
      </button>

      <Link
        to={`/admin/edit/${benchmark.id}`}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-bg-hover transition-colors"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <Pencil size={12} />
        <span className="hidden sm:inline">{labels.edit}</span>
      </Link>

      {canDelete && (
        <button
          onClick={() => onDelete(benchmark)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">{labels.delete}</span>
        </button>
      )}
    </div>
  );
}
