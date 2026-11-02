import { AlertCircle, RotateCw } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

interface Props {
  onRetry: () => void;
}

export function AuthBootstrapError({ onRetry }: Props) {
  const { t } = useApp();

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center py-16 px-4 rounded-xl max-w-md mx-auto my-16"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <AlertCircle size={32} className="mb-3" style={{ color: 'var(--text-secondary)' }} />
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
        {t.auth.sessionErrorTitle}
      </p>
      <p className="text-sm mb-5 text-center" style={{ color: 'var(--text-secondary)' }}>
        {t.auth.sessionErrorText}
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
        {t.auth.retry}
      </button>
    </div>
  );
}
