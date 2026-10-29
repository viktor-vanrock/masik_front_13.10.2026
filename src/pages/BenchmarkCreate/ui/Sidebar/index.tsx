import type { Dialogue, DisplayStatus } from '@/types';
import { ChevronRight, Menu } from 'lucide-react';
import { DialogueListItem } from './DialogueListItem';
import { useApp } from '@/hooks/useApp';
import { useMemo, useRef, useState } from 'react';

interface Props {
  dialogues: Dialogue[];
  onLoadMore: () => Promise<unknown>;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeId: string | null;
  onNewSession: () => void;
  onSelectDialogue: (id: string) => void;
  onTogglePin: (id: string) => void;
  deriveDisplayStatus: (dialogue: Dialogue) => DisplayStatus;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export const Sidebar = ({
  dialogues,
  onLoadMore,
  hasMore,
  isLoadingMore,
  activeId,
  onNewSession,
  onSelectDialogue,
  onTogglePin,
  deriveDisplayStatus,
  mobileOpen,
  onToggleMobile,
  onCloseMobile,
}: Props) => {
  const { t } = useApp();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const loadPending = useRef(false);

  const { pinnedDialogues, historyDialogues, archivedDialogues } = useMemo(() => {
    const activeDialogues = dialogues.filter((dialogue) => !dialogue.isArchived);
    const byUpdated = (a: Dialogue, b: Dialogue) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id.localeCompare(a.id);
    return {
      pinnedDialogues: activeDialogues.filter((dialogue) => dialogue.pinnedDate)
        .sort((a, b) => Date.parse(b.pinnedDate!) - Date.parse(a.pinnedDate!) || b.id.localeCompare(a.id)),
      historyDialogues: activeDialogues.filter((dialogue) => !dialogue.pinnedDate).sort(byUpdated),
      archivedDialogues: dialogues.filter((dialogue) => dialogue.isArchived).sort(byUpdated),
    };
  }, [dialogues]);

  return (
    <aside
      className={[
        'relative z-30 flex w-[260px] min-w-[260px] h-full flex-col gap-5 border-r border-[var(--border)] py-7 px-5 bg-[#fcfcfd]',
        'max-[600px]:w-[60px] max-[600px]:min-w-[60px] max-[600px]:flex-[0_0_60px] max-[600px]:gap-0 max-[600px]:py-3 max-[600px]:px-2',
        mobileOpen ? 'max-[600px]:absolute max-[600px]:inset-y-0 max-[600px]:left-0 max-[600px]:w-[min(280px,calc(100vw-56px))] max-[600px]:min-w-0 max-[600px]:px-4 max-[600px]:py-3 max-[600px]:shadow-[12px_0_32px_#1e1e201a]' : '',
      ].join(' ')}
    >
      <button
        type="button"
        className="hidden max-[600px]:grid relative z-[2] w-10 h-10 flex-none place-items-center border border-[var(--border)] rounded-[10px] m-0 bg-white text-[#515dad] cursor-pointer"
        onClick={onToggleMobile}
        aria-label={mobileOpen ? 'Закрыть список чатов' : 'Открыть список чатов'}
        aria-expanded={mobileOpen}
      >
        <Menu size={20} />
      </button>

      <div className={[
        'relative flex min-h-0 flex-1 flex-col gap-5',
        mobileOpen ? 'max-[600px]:flex max-[600px]:pt-2' : 'max-[600px]:hidden',
      ].join(' ')}>
        <button
          type="button"
          onClick={() => { onNewSession(); onCloseMobile(); }}
          className="grid w-full min-h-[44px] flex-none items-center grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] border border-transparent rounded-[30px] py-2.5 px-5 bg-[#515dad] text-white text-xs font-medium cursor-pointer transition-colors duration-150 hover:border-[#465195] hover:bg-[#465195]"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className="col-start-1 justify-self-end w-4 h-4 mr-2 fill-none stroke-current stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]">
            <path d="M9 3v12M3 9h12" />
          </svg>
          <span className="col-start-2 whitespace-nowrap">{t.create.newChat}</span>
        </button>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 scrollbar-thin"
          onScroll={(event) => {
            const element = event.currentTarget;
            if (hasMore && !isLoadingMore && !loadPending.current && element.scrollHeight - element.scrollTop - element.clientHeight < 120) {
              loadPending.current = true;
              void onLoadMore().finally(() => { loadPending.current = false; });
            }
          }}
        >
          {pinnedDialogues.length > 0 && <section>
            <div className="grid content-start gap-2">
              {pinnedDialogues.map((dialogue) => (
                <DialogueListItem
                  key={dialogue.id}
                  dialogue={dialogue}
                  onTogglePin={() => onTogglePin(dialogue.id)}
                  displayStatus={deriveDisplayStatus(dialogue)}
                  isActive={dialogue.id === activeId}
                  onClick={() => { onSelectDialogue(dialogue.id); onCloseMobile(); }}
                />
              ))}
            </div>
          </section>}
          <section className={pinnedDialogues.length > 0 ? 'mt-2' : ''}>
            <div className="grid content-start gap-2">
              {historyDialogues.map((dialogue) => (
                <DialogueListItem
                  key={dialogue.id}
                  dialogue={dialogue}
                  onTogglePin={() => onTogglePin(dialogue.id)}
                  displayStatus={deriveDisplayStatus(dialogue)}
                  isActive={dialogue.id === activeId}
                  onClick={() => {
                    onSelectDialogue(dialogue.id);
                    onCloseMobile();
                  }}
                />
              ))}
            </div>
          </section>
          {isLoadingMore && <p className="py-2 text-center text-xs text-[#686e78]" role="status">{t.create.loadingChats}</p>}
        </div>

        <div className="static flex-none mt-auto">
          {archiveOpen && (
            <div className="absolute z-10 inset-x-0 top-16 bottom-10 flex min-h-0 flex-col gap-2 overflow-hidden pt-2 px-1 bg-[#fcfcfd] origin-bottom animate-[archive-open_180ms_ease-out_both]">
              <p className="flex-none text-xs leading-[1.5] text-[#686e78]">Архивированные чаты</p>
              <div className="grid min-h-0 content-start flex-1 gap-1 overflow-y-auto overscroll-contain pr-2 scrollbar-thin">
                {archivedDialogues.length ? archivedDialogues.map((dialogue) => (
                  <DialogueListItem
                    key={dialogue.id}
                    dialogue={dialogue}
                    onTogglePin={() => onTogglePin(dialogue.id)}
                    displayStatus={deriveDisplayStatus(dialogue)}
                    isActive={dialogue.id === activeId}
                    isArchived
                    onClick={() => {
                      onSelectDialogue(dialogue.id);
                      onCloseMobile();
                    }}
                  />
                )) : (
                  <p className="py-3.5 px-2.5 text-[11px] text-[#686e78]">Архив пуст</p>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            className="flex w-full min-h-[40px] items-center gap-2 border-0 rounded-none py-2 px-1 bg-transparent text-[#686e78] text-xs text-left cursor-pointer"
            onClick={() => setArchiveOpen((open) => !open)}
            aria-expanded={archiveOpen}
          >
            <ChevronRight size={15} className={`transition-transform duration-150 ${archiveOpen ? 'rotate-90' : ''}`} />
            <span className="min-w-0 flex-1">Архивированные чаты ({archivedDialogues.length})</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
