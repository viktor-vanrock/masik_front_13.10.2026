import { useEffect, useRef, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { DisplayStatus } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogueName?: string;
  displayStatus?: DisplayStatus;
  isTyping: boolean;
  onRename: (name: string) => void;
  onArchive: () => void;
  isArchived?: boolean;
}

export const CreateHeader = ({
  dialogueName,
  displayStatus,
  isTyping,
  onRename,
  onArchive,
  isArchived = false,
}: Props) => {
  const { lang } = useApp();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [nextName, setNextName] = useState(dialogueName ?? '');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isRenameOpen) return;
    // Keep the draft tied to opening the dialog, not later title updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNextName(dialogueName ?? '');
    const frame = requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRenameOpen]);

  useEffect(() => {
    if (!isRenameOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsRenameOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isRenameOpen]);

  const saveName = () => {
    const trimmedName = nextName.trim();
    if (!trimmedName) return;
    onRename(trimmedName);
    setIsRenameOpen(false);
  };

  if (!dialogueName) {
    return null;
  }

  const iconBtnClass = 'grid w-8 h-8 flex-none place-items-center border-0 rounded-md p-0.5 bg-transparent text-[#3a427b] cursor-pointer hover:bg-[#eeeff7] disabled:cursor-wait disabled:opacity-50';

  return (
    <div className="flex items-start justify-between gap-6 flex-shrink-0 pt-8 px-10 pb-3 bg-white max-[600px]:gap-3 max-[600px]:px-4 max-[600px]:pt-6 max-[600px]:pb-7">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center flex-wrap gap-3 mb-0">
          <h1 className="min-w-0 m-0 text-[26px] font-medium leading-[1.3] text-[#1e1e20] break-words max-[600px]:text-2xl">
            {dialogueName}
          </h1>
          <button
            type="button"
            onClick={() => setIsRenameOpen(true)}
            disabled={isTyping}
            className={iconBtnClass}
            aria-label={lang === 'ru' ? 'Изменить название' : 'Edit name'}
            title={lang === 'ru' ? 'Изменить название' : 'Edit name'}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onArchive}
            disabled={isTyping}
            className={iconBtnClass}
            aria-label={isArchived
              ? (lang === 'ru' ? 'Вернуть из архива' : 'Unarchive')
              : (lang === 'ru' ? 'Добавить в архив' : 'Add to archive')}
            title={isArchived
              ? (lang === 'ru' ? 'Вернуть из архива' : 'Unarchive')
              : (lang === 'ru' ? 'Добавить в архив' : 'Add to archive')}
          >
            {isArchived
              ? <ArchiveRestore size={14} aria-hidden="true" />
              : <Archive size={14} aria-hidden="true" />}
          </button>
        </div>
        <p className="m-0 mb-2 text-xs leading-[1.6] text-[#686e78] max-[600px]:max-w-[250px] max-[600px]:text-[11px]">
          {lang === 'ru'
            ? 'Расскажите о задаче. Вместе определим, как её проверять.'
            : 'Describe your task. Together, we will define how to evaluate it.'}
        </p>
      </div>

      {displayStatus && (
        <div className="flex-none pt-0.5">
          <StatusBadge status={displayStatus} />
        </div>
      )}

      {isRenameOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-5 bg-[#1e1e2038] backdrop-blur-[6.4px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsRenameOpen(false);
          }}
        >
          <section
            className="relative flex w-[min(600px,calc(100vw-32px))] h-[min(294px,calc(100dvh-32px))] flex-col justify-center border border-[#e9edf2] rounded-3xl p-8 bg-white shadow-[0_20px_64px_#1e1e2026]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-rename-title"
          >
            <button
              type="button"
              className="absolute top-8 right-8 grid w-10 h-10 place-items-center border border-[#e9edf2] rounded-[10px] bg-transparent text-[#1e1e20] cursor-pointer hover:bg-[#f3f4f7] hover:border-[#bfc5d3]"
              onClick={() => setIsRenameOpen(false)}
              aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h2 id="benchmark-rename-title" className="-mt-1 mb-6 text-2xl font-medium leading-[1.4] text-left text-[#1e1e20]">
              {lang === 'ru' ? 'Переименовать чат' : 'Rename chat'}
            </h2>
            <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); saveName(); }}>
              <label htmlFor="benchmark-chat-name" className="text-xs leading-[1.5] text-[#1e1e20]">
                {lang === 'ru' ? 'Название чата' : 'Chat name'}
              </label>
              <input
                ref={renameInputRef}
                id="benchmark-chat-name"
                type="text"
                maxLength={255}
                value={nextName}
                onChange={(event) => setNextName(event.target.value)}
                className="w-full h-12 border border-[#d1d7de] rounded-lg px-3 bg-white text-[#1e1e20] text-sm outline-none focus:border-[#515dad]"
              />
              <div className="h-px mt-4 bg-[#e9edf2]" aria-hidden="true" />
              <button
                type="submit"
                disabled={!nextName.trim()}
                className="inline-flex w-fit justify-self-end min-h-[44px] items-center justify-center gap-2 mt-4 border border-[#515dad] rounded-[30px] px-5 bg-[#515dad] text-white text-[13px] font-medium cursor-pointer hover:bg-[#465195] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {lang === 'ru' ? 'Сохранить' : 'Save'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-none">
                  <path d="m3 9 4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};
