import { Loader2, Trash2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useDeleteSuiteMutation } from '@/api/catalog';
import { useApiError } from '@/hooks/useApiError';
import type { BenchmarkSuite } from '@/types';

interface Props {
  category: BenchmarkSuite;
  onClose: () => void;
}

export const CategoryDeleteModal = ({ category, onClose }: Props) => {
  const { t, lang } = useApp();
  const deleteMutation = useDeleteSuiteMutation();
  const { serverError, handleError } = useApiError();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(category.id);
      onClose();
    } catch (e) {
      handleError(e, { fallback: t.admin.categories.deleteFallback, onForbidden: 'message' });
    }
  };

  const isPending = deleteMutation.isPending;
  const displayName = lang === 'en' ? category.nameEn : category.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: '#FEF2F2' }}
        >
          <Trash2 size={18} style={{ color: '#DC2626' }} />
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t.admin.categories.confirmDelete}
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium">{displayName}</span>
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          {t.admin.categories.confirmDeleteHint}
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-4 p-2 rounded-lg text-xs"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            {serverError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {t.admin.categories.cancel}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: '#DC2626' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {t.admin.categories.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
