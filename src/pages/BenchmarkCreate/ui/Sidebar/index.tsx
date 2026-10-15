import type { Dialogue, DisplayStatus } from '@/types';
import { ChevronRight, Menu } from 'lucide-react';
import { DialogueListItem } from './DialogueListItem';
import { useApp } from '@/hooks/useApp';
import { useState } from 'react';

interface Props {
  dialogues: Dialogue[];
  activeId: string | null;
  onNewSession: () => void;
  onSelectDialogue: (id: string) => void;
  archivedIds: string[];
  onToggleArchive: (id: string) => void;
  deriveDisplayStatus: (dialogue: Dialogue) => DisplayStatus;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export const Sidebar = ({
  dialogues,
  activeId,
  onNewSession,
  onSelectDialogue,
  archivedIds,
  onToggleArchive,
  deriveDisplayStatus,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: Props) => {
  const { t } = useApp();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const archivedIdSet = new Set(archivedIds);
  const activeDialogues = dialogues.filter((dialogue) => !archivedIdSet.has(dialogue.id));
  const archivedDialogues = dialogues.filter((dialogue) => archivedIdSet.has(dialogue.id));

  return (
  <aside className={`benchmark-create-sidebar ${mobileOpen ? 'is-open' : ''}`}>
    <button
      type="button"
      className="benchmark-create-sidebar__mobile-toggle"
      onClick={onToggleMobile}
      aria-label={mobileOpen ? 'Закрыть список чатов' : 'Открыть список чатов'}
      aria-expanded={mobileOpen}
    >
      <Menu size={20} />
    </button>

    <div className="benchmark-create-sidebar__content">
      <button type="button" onClick={() => { onNewSession(); onCloseMobile(); }} className="benchmark-create-sidebar__new-chat">
        <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 3v12M3 9h12" /></svg>
        <span>{t.create.newChat}</span>
      </button>

      <div className="benchmark-create-sidebar__list">
        <p className="benchmark-create-sidebar__label">Чаты создания бенчмарков</p>
        <div className="benchmark-create-sidebar__items">
          {activeDialogues.map((dialogue) => (
            <DialogueListItem
              key={dialogue.id}
              dialogue={dialogue}
              displayStatus={deriveDisplayStatus(dialogue)}
              isActive={dialogue.id === activeId}
              onArchiveToggle={() => onToggleArchive(dialogue.id)}
              onClick={() => {
                onSelectDialogue(dialogue.id);
                onCloseMobile();
              }}
            />
          ))}
        </div>
      </div>
      <div className="benchmark-create-sidebar__archive">
        {archiveOpen && (
          <div className="benchmark-create-sidebar__archive-popover">
            <p className="benchmark-create-sidebar__archive-heading">Архивированные чаты</p>
            <div className="benchmark-create-sidebar__archive-items">
              {archivedDialogues.length ? archivedDialogues.map((dialogue) => (
                <DialogueListItem
                  key={dialogue.id}
                  dialogue={dialogue}
                  displayStatus={deriveDisplayStatus(dialogue)}
                  isActive={dialogue.id === activeId}
                  onClick={() => {
                    onSelectDialogue(dialogue.id);
                    onCloseMobile();
                  }}
                />
              )) : (
                <p className="benchmark-create-sidebar__archive-empty">Архив пуст</p>
              )}
            </div>
          </div>
        )}
        <button
          type="button"
          className="benchmark-create-sidebar__archive-toggle"
          onClick={() => setArchiveOpen((open) => !open)}
          aria-expanded={archiveOpen}
        >
          <ChevronRight size={15} className={archiveOpen ? 'is-open' : ''} />
          <span>Архивированные чаты ({archivedDialogues.length})</span>
        </button>
      </div>
    </div>
  </aside>
  );
};
