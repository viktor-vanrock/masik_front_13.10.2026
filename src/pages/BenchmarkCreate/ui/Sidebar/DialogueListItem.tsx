import { Pin, Trash2 } from 'lucide-react';
import type { Dialogue, DisplayStatus } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogue: Dialogue;
  displayStatus: DisplayStatus;
  isActive: boolean;
  onClick: () => void;
  onTogglePin: () => void;
  onDelete?: () => void;
  isArchived?: boolean;
}

const status: Record<DisplayStatus, { label: string; en: string; className: string }> = {
  draft: { label: 'Интервью', en: 'Interview', className: 's-interview' },
  summary: { label: 'Интервью', en: 'Interview', className: 's-interview' },
  generating: { label: 'Генерация', en: 'Generating', className: 's-gen' },
  samples: { label: 'Проверка примеров', en: 'Samples review', className: 's-review' },
  producing: { label: 'Масштабирование', en: 'Scaling', className: 's-gen' },
  ready: { label: 'Готов', en: 'Ready', className: 's-ready' },
  submitted: { label: 'На проверке', en: 'Submitted', className: 's-review' },
};

export function DialogueListItem({ dialogue, displayStatus, isActive, onClick, onTogglePin, onDelete, isArchived = false }: Props) {
  const { lang } = useApp();
  const title = lang === 'en' ? dialogue.benchmarkNameEn || dialogue.benchmarkName : dialogue.benchmarkName;
  const pinLabel = `${dialogue.pinnedDate ? 'Открепить' : 'Закрепить'} чат «${title}»`;
  const display = status[displayStatus];
  return <div className={`chat-item${dialogue.pinnedDate ? ' pinned' : ''}`} role="button" tabIndex={0} data-id={dialogue.id} aria-current={isActive ? 'true' : 'false'} onClick={onClick} onKeyDown={event => {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick(); }
  }}>
    <b>{title}</b>
    <span className={`status ${display.className}`}>{lang === 'en' ? display.en : display.label}</span>
    <span className="ci-acts">
      <button className="pin" type="button" data-id={dialogue.id} aria-pressed={Boolean(dialogue.pinnedDate)} aria-label={pinLabel} title={pinLabel} aria-disabled={!dialogue.conversationId || isArchived ? 'true' : undefined} onClick={event => { event.stopPropagation(); if (dialogue.conversationId && !isArchived) onTogglePin(); }}><Pin aria-hidden="true" /></button>
      <button className="del" type="button" data-id={dialogue.id} aria-label={`Удалить чат «${title}»`} title="Удалить чат" disabled={!dialogue.conversationId || !onDelete} onClick={event => { event.stopPropagation(); onDelete?.(); }}><Trash2 aria-hidden="true" /></button>
    </span>
  </div>;
}
