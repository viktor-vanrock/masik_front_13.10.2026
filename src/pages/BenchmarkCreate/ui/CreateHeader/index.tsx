import { PlusCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { DialogueStatus } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogueName?: string;
  dialogueStatus?: DialogueStatus;
  isTyping: boolean;
  showSkipToCreate: boolean;
  onSkipToCreate: () => void;
}

export const CreateHeader = ({
  dialogueName, 
  dialogueStatus,
  isTyping,
  showSkipToCreate,
  onSkipToCreate
}: Props) => {
  const { t: { create }} = useApp();
  
  if(!dialogueName || !dialogueStatus) {
    return null;
  }

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-navbar)',
      }}
    >    
      <>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {dialogueName}
          </p>
          {showSkipToCreate && (
            <button
              type="button"
              onClick={onSkipToCreate}
              disabled={isTyping}
              className="text-xs font-medium flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-lg border transition-colors disabled:opacity-50"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-blue-on-bg)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <PlusCircle size={12} />
              {create.skipToCreate}
            </button>
          )}
        </div>
        <StatusBadge status={dialogueStatus} />
      </>
    </div>
  );
}