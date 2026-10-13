
import type { Dialogue } from '@/types';
import { DialogueListItem } from './DialogueListItem';
import { PlusCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogues: Dialogue[];
  activeId: string | null;
  onNewSession: () => void;
  onSelectDialogue: (id: string) => void;
}

export const Sidebar = ({
  dialogues,
  activeId,
  onNewSession,
  onSelectDialogue
}: Props) => {
  const { t } = useApp();

  return (
    <aside
      className={`
        'translate-x-0'
        md:translate-x-0 fixed md:relative z-30 md:z-auto
        w-72 flex-shrink-0 flex flex-col h-full transition-transform duration-200
      `}
      style={{
        backgroundColor: 'var(--bg-navbar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onNewSession}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={15} />
          {t.create.newChat}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs px-2 mb-2 font-medium" style={{ color: 'var(--text-dim)' }}>
          {t.create.myDialogues}
        </p>
        
        {dialogues.map((d) => (
          <DialogueListItem
            key={d.id}
            dialogue={d}
            isActive={d.id === activeId}
            onClick={() => onSelectDialogue(d.id)}
          />
        ))}
      </div>
    </aside>
  );
}