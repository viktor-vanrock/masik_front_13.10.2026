import { AlertCircle, RotateCw } from 'lucide-react';
import { formatServerErrorMessage } from '@/services/http';
import { useApp } from '@/hooks/useApp';

interface Props {
  error: unknown;
  onRetry: () => void;
}

export function CatalogErrorState({ error, onRetry }: Props) {
  const { t } = useApp();
  const message = formatServerErrorMessage(error) ?? t.catalogue.loadErrorFallback;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 rounded-xl"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <AlertCircle size={32} className="mb-3" style={{ color: 'var(--text-secondary)' }} />
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {t.catalogue.loadErrorTitle}
      </p>
      <p className="text-sm mb-5 max-w-md text-center" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        style={{
          color: 'var(--button-primary)',
          backgroundColor: 'var(--button-primary-bg)',
        }}
      >
        <RotateCw size={14} />
        {t.catalogue.retry}
      </button>
    </div>
  );
}
