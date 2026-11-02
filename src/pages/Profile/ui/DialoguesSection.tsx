import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { DialoguesList } from './DialoguesList';
import type { Dialogue } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogues: Dialogue[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export const DialoguesSection = ({ dialogues, isPending, isError, onRetry }: Props) => {
  const { t } = useApp();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t.profile.creationSessions}
        </h2>
        <Link
          to="/create"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={14} />
          {t.profile.newBenchmark}
        </Link>
      </div>

      {isPending ? (
        <p role="status" className="py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t.common.loading}
        </p>
      ) : isError ? (
        <div role="alert" className="py-6 space-y-3 text-sm" style={{ color: 'var(--danger)' }}>
          <p>{t.profile.dialoguesLoadError}</p>
          <button type="button" onClick={onRetry} className="underline">
            {t.catalogue.retry}
          </button>
        </div>
      ) : dialogues.length === 0 ? (
        <EmptyState />
      ) : (
        <DialoguesList dialogues={dialogues} />
      )}
    </>
  );
}
