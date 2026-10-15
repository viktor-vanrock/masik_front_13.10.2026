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
    setNextName(dialogueName ?? '');
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [isRenameOpen, dialogueName]);

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

  return (
    <div
      className="benchmark-create-page-head flex-shrink-0"
    >    
      <div className="benchmark-create-page-head__copy">
        <div className="benchmark-create-page-head__title-row">
          <h1>{dialogueName}</h1>
          <button
            type="button"
            onClick={() => setIsRenameOpen(true)}
            disabled={isTyping}
            aria-label={lang === 'ru' ? 'Изменить название' : 'Edit name'}
            title={lang === 'ru' ? 'Изменить название' : 'Edit name'}
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onArchive}
            disabled={isTyping}
            className="benchmark-create-page-head__archive"
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
        <p>{lang === 'ru'
          ? 'Расскажите о задаче. Вместе определим, как её проверять.'
          : 'Describe your task. Together, we will define how to evaluate it.'}</p>
      </div>
      {displayStatus && (
        <div className="benchmark-create-page-head__status">
          <StatusBadge status={displayStatus} />
        </div>
      )}
      {isRenameOpen && (
        <div
          className="benchmark-rename-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsRenameOpen(false);
          }}
        >
          <section
            className="benchmark-rename-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-rename-title"
          >
            <button
              type="button"
              className="benchmark-rename-modal__close"
              onClick={() => setIsRenameOpen(false)}
              aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <h2 id="benchmark-rename-title">
              {lang === 'ru' ? 'Переименовать чат' : 'Rename chat'}
            </h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveName();
              }}
            >
              <label htmlFor="benchmark-chat-name">
                {lang === 'ru' ? 'Название чата' : 'Chat name'}
              </label>
              <input
                ref={renameInputRef}
                id="benchmark-chat-name"
                type="text"
                maxLength={255}
                value={nextName}
                onChange={(event) => setNextName(event.target.value)}
              />
              <div className="benchmark-rename-modal__separator" aria-hidden="true" />
              <button type="submit" disabled={!nextName.trim()}>
                {lang === 'ru' ? 'Сохранить' : 'Save'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m3 9 4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
