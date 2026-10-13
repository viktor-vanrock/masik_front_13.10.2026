import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useDeleteDictionaryMutation } from '@/api/settings';
import { useApiError } from '@/hooks/useApiError';
import type { DictionaryCategory, DictionarySettingsEntry } from '@/types';

type PairCast = Parameters<typeof useDeleteDictionaryMutation>[0];

interface Props {
  category: DictionaryCategory;
  type: string;
  entry: DictionarySettingsEntry;
  onClose: () => void;
}

export function DictionaryDeleteModal({ category, type, entry, onClose }: Props) {
  const { t, lang } = useApp();
  const s = t.admin.settings;

  const pair = { category, type } as PairCast;
  const deleteMutation = useDeleteDictionaryMutation(pair);
  const { serverError, handleError } = useApiError();

  const isBlocked = entry.usageCount > 0;
  const displayName = lang === 'ru' ? entry.name : entry.nameEn;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(entry.id);
      onClose();
    } catch (e) {
      handleError(e, { fallback: s.deleteFallback, onForbidden: 'message' });
    }
  };

  const isPending = deleteMutation.isPending;

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
          style={{ backgroundColor: isBlocked ? 'var(--bg-elevated)' : '#FEF2F2' }}
        >
          {isBlocked
            ? <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            : <Trash2 size={18} style={{ color: '#DC2626' }} />
          }
        </div>

        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {s.confirmDelete}
        </h2>
        <p className="text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
          {displayName}
        </p>

        {isBlocked ? (
          <p className="text-sm mt-3" style={{ color: 'var(--warning)' }}>
            {s.usageBlocked.replace('{count}', String(entry.usageCount))}
          </p>
        ) : (
          <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
            {s.confirmDeleteHint}
          </p>
        )}

        {serverError && (
          <div
            role="alert"
            className="mt-3 mb-2 p-2 rounded-lg text-xs"
            style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}
          >
            {serverError}
          </div>
        )}

        <div className={`flex gap-3 ${isBlocked ? 'mt-4' : ''}`}>
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
            {s.cancel}
          </button>
          {!isBlocked && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#DC2626' }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {s.confirmDeleteBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
