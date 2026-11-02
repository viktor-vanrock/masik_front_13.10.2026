import type { Dialogue, DisplayStatus } from '@/types';
import { Plus } from 'lucide-react';
import { DialogueListItem } from './DialogueListItem';
import { useApp } from '@/hooks/useApp';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  dialogues: Dialogue[];
  onLoadMore: () => Promise<unknown>;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMoreArchived: () => Promise<unknown>;
  hasMoreArchived: boolean;
  isLoadingMoreArchived: boolean;
  archivedTotal: number;
  activeId: string | null;
  onNewSession: () => void;
  onSelectDialogue: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteDialogue: (id: string) => Promise<void>;
  deriveDisplayStatus: (dialogue: Dialogue) => DisplayStatus;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({ dialogues, onLoadMore, hasMore, isLoadingMore, onLoadMoreArchived, hasMoreArchived, isLoadingMoreArchived, archivedTotal, activeId, onNewSession, onSelectDialogue, onTogglePin, onDeleteDialogue, deriveDisplayStatus, mobileOpen, onCloseMobile }: Props) {
  const { t, lang } = useApp();
  const [deleteTarget, setDeleteTarget] = useState<Dialogue | null>(null);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);
  const deleteOpener = useRef<HTMLElement | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const asideRef = useRef<HTMLElement>(null);
  const loadPending = useRef(false);
  const archiveLoadPending = useRef(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = (event: MediaQueryListEvent) => setMobile(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside || !mobile || !mobileOpen || deleteTarget) return;
    const previousFocus = document.getElementById('sideBtn') ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const controls = () => [...aside.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, summary, [tabindex]')].filter(element => {
      const style = window.getComputedStyle(element);
      return element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden]')
        && style.display !== 'none' && style.visibility !== 'hidden';
    });
    const focusFirst = () => (aside.querySelector<HTMLElement>('#newChat') ?? controls()[0])?.focus({ preventScroll: true });
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = controls();
      const first = focusable[0], last = focusable.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !aside.contains(document.activeElement))) {
        event.preventDefault(); last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !aside.contains(document.activeElement))) {
        event.preventDefault(); first.focus({ preventScroll: true });
      }
    };
    const containFocus = (event: FocusEvent) => { if (event.target instanceof Node && !aside.contains(event.target)) focusFirst(); };
    document.addEventListener('keydown', trapTab, true);
    document.addEventListener('focusin', containFocus);
    if (!aside.contains(document.activeElement)) focusFirst();
    return () => {
      document.removeEventListener('keydown', trapTab, true);
      document.removeEventListener('focusin', containFocus);
      if (window.matchMedia('(max-width: 760px)').matches && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [mobile, mobileOpen, deleteTarget]);
  const { pinned, history, archived } = useMemo(() => {
    const byUpdated = (a: Dialogue, b: Dialogue) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id.localeCompare(a.id);
    const active = dialogues.filter(dialogue => !dialogue.isArchived);
    return {
      pinned: active.filter(dialogue => dialogue.pinnedDate).sort((a, b) => Date.parse(b.pinnedDate!) - Date.parse(a.pinnedDate!) || b.id.localeCompare(a.id)),
      history: active.filter(dialogue => !dialogue.pinnedDate).sort(byUpdated),
      archived: dialogues.filter(dialogue => dialogue.isArchived).sort(byUpdated),
    };
  }, [dialogues]);
  const item = (dialogue: Dialogue) => <DialogueListItem key={dialogue.id} dialogue={dialogue} displayStatus={deriveDisplayStatus(dialogue)} isActive={dialogue.id === activeId} isArchived={dialogue.isArchived} onTogglePin={() => onTogglePin(dialogue.id)} onDelete={() => { deleteOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setDeleteTarget(dialogue); }} onClick={() => { onSelectDialogue(dialogue.id); onCloseMobile(); }} />;
  const load = (archive: boolean) => {
    const pending = archive ? archiveLoadPending : loadPending;
    if (pending.current || (archive ? !hasMoreArchived || isLoadingMoreArchived : !hasMore || isLoadingMore)) return;
    pending.current = true;
    void (archive ? onLoadMoreArchived() : onLoadMore()).catch(() => {}).finally(() => { pending.current = false; });
  };
  return <><aside ref={asideRef} className="cr-side" aria-label="История чатов" inert={(mobile && !mobileOpen) || Boolean(deleteTarget)} role={mobile && mobileOpen ? 'dialog' : undefined} aria-modal={mobile && mobileOpen ? true : undefined}>
    <div className="cr-side-head"><button className="btn btn-primary" type="button" id="newChat" onClick={() => { onNewSession(); onCloseMobile(); }}><Plus aria-hidden="true" />{t.create.newChat}</button></div>
    <div className="chats" id="chatList" onScroll={event => { const element = event.currentTarget; if (element.scrollHeight - element.scrollTop - element.clientHeight < 120) load(false); }}>
      {pinned.length > 0 && <><p className="overline">Закреплённые</p>{pinned.map(item)}</>}
      {history.length > 0 && <><p className="overline">История</p>{history.map(item)}</>}
      {isLoadingMore && <p className="note" role="status">{t.create.loadingChats}</p>}
      {hasMore && !isLoadingMore && <button className="linkbtn" type="button" onClick={() => load(false)}>Загрузить ещё</button>}
      {archivedTotal > 0 && <details open={archiveOpen} onToggle={event => setArchiveOpen(event.currentTarget.open)}><summary>Архивированные чаты ({archivedTotal})</summary>{archiveOpen && <>{archived.map(item)}{isLoadingMoreArchived && <p className="note" role="status">{t.create.loadingChats}</p>}{hasMoreArchived && <button className="linkbtn" type="button" disabled={isLoadingMoreArchived} onClick={() => load(true)}>Загрузить ещё</button>}</>}</details>}
    </div>
  </aside>{deleteTarget && <ChatDeleteDialog opener={deleteOpener} title={lang === 'en' ? deleteTarget.benchmarkNameEn : deleteTarget.benchmarkName}
    onClose={closeDelete} onConfirm={async () => { await onDeleteDialogue(deleteTarget.id); setDeleteTarget(null); }} />}</>;
}

function ChatDeleteDialog({ title, onClose, onConfirm, opener }: { title: string; onClose: () => void; onConfirm: () => Promise<void>; opener: { current: HTMLElement | null } }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const inFlight = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = opener.current;
    const focusFirst = () => (dialogRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)') ?? dialogRef.current)?.focus({ preventScroll: true });
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) focusFirst();
    };
    cancelRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !inFlight.current) { event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!buttons?.length) { event.preventDefault(); focusFirst(); return; }
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', containFocus);
      const fallback = document.querySelector<HTMLElement>('.cr-side:not([inert]) #newChat') ?? document.getElementById('sideBtn');
      (previousFocus?.isConnected ? previousFocus : fallback)?.focus();
    };
  }, [onClose, opener]);
  useEffect(() => {
    if (pending) dialogRef.current?.focus();
    else if (document.activeElement === dialogRef.current) cancelRef.current?.focus();
  }, [pending]);
  const confirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setError(false);
    try { await onConfirm(); } catch { setError(true); } finally { inFlight.current = false; setPending(false); }
  };
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => { if (!pending) onClose(); }}>
    <div ref={dialogRef} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby="delete-chat-title" aria-describedby="delete-chat-description" className="w-full max-w-sm rounded-2xl p-6"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={event => event.stopPropagation()}>
      <h2 id="delete-chat-title" className="mb-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Удалить чат?</h2>
      <p id="delete-chat-description" className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>Чат «{title}» будет удалён из истории.</p>
      {error && <p role="alert" className="mb-4 text-sm" style={{ color: '#DC2626' }}>Не удалось удалить чат. Попробуйте ещё раз.</p>}
      <div className="flex gap-3"><button ref={cancelRef} type="button" className="flex-1 rounded-xl py-2.5 text-sm" disabled={pending} onClick={onClose}
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Отмена</button>
      <button type="button" className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: '#DC2626' }} disabled={pending} onClick={() => { void confirm(); }}>{pending ? 'Удаляем…' : 'Удалить'}</button></div>
    </div>
  </div>, document.body);
}
