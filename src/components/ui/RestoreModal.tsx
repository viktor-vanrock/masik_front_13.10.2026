import { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { formatServerErrorMessage } from '@/services/http';

interface Props {
  entityName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const RestoreModal = ({ entityName, isPending, onClose, onConfirm }: Props) => {
  const { t } = useApp();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(formatServerErrorMessage(e) ?? t.admin.restoreError);
    }
  };

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
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <RotateCcw size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t.admin.confirmRestore}
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium">{entityName}</span>
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          {t.admin.confirmRestoreHint}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 p-2 rounded-lg text-xs"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
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
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {t.admin.restore}
          </button>
        </div>
      </div>
    </div>
  );
};
