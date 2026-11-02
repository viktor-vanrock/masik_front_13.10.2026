import { Trash2, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useDeleteBenchmarkMutation } from '@/api/catalog';
import { useApiError } from '@/hooks/useApiError';
import type { BenchmarkType } from '@/types';

interface Props {
  deleteTarget: BenchmarkType;
  setDeleteTarget: (item: BenchmarkType | null) => void;
}

export const DeleteModal = ({ deleteTarget, setDeleteTarget }: Props) => {
  const { t, lang } = useApp();
  const deleteMutation = useDeleteBenchmarkMutation();
  const { serverError, handleError } = useApiError();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      handleError(e, { fallback: t.common.errors.deleteFailed, onForbidden: 'message' });
    }
  };

  const isPending = deleteMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => !isPending && setDeleteTarget(null)}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--admin-danger-bg)' }}
        >
          <Trash2 size={18} style={{ color: 'var(--admin-danger-ink)' }} />
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t.admin.confirmDelete}
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium">
            {lang === 'en' ? deleteTarget.nameEn : deleteTarget.name}
          </span>
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          {t.admin.confirmDeleteHint}
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-4 p-2 rounded-lg text-xs"
            style={{
              backgroundColor: 'var(--admin-danger-bg)',
              color: 'var(--admin-danger-ink)',
              border: '1px solid var(--admin-danger-border)',
            }}
          >
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {t.admin.cancel}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--admin-danger-ink)' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {t.admin.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
