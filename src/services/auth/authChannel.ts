const CHANNEL_NAME = 'auth';
const SESSION_CHANGED = 'auth-session-changed';
const ABORT_PENDING_LOGOUT = 'auth-abort-pending-logout';

const supported = typeof BroadcastChannel !== 'undefined';

function createTabId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const TAB_ID = createTabId();

interface SessionChangedMessage {
  type: typeof SESSION_CHANGED;
  sourceId: string;
}

interface AbortPendingLogoutMessage {
  type: typeof ABORT_PENDING_LOGOUT;
  sourceId: string;
}

/** Сообщить другим вкладкам об изменении сессии (успех login/register/logout). */
export function broadcastAuthSessionChanged(): void {
  if (!supported) return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const message: SessionChangedMessage = { type: SESSION_CHANGED, sourceId: TAB_ID };
  channel.postMessage(message);
  channel.close();
}

/** Подписка на сигнал. Handler НЕ должен ре-броадкастить — только реагировать. */
export function subscribeAuthSessionChange(handler: () => void): () => void {
  if (!supported) return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const listener = (event: MessageEvent) => {
    if (event.data?.type !== SESSION_CHANGED) return;
    if (event.data.sourceId === TAB_ID) return;
    handler();
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
    channel.close();
  };
}

/**
 * Сигнал "отмени свой pending logout" — шлётся сразу после успешного login/register,
 * до подтверждения профиля. НЕ трогает барьер и НЕ запускает profile-рефетч у получателя —
 * для этого используется отдельный broadcastAuthSessionChanged после profile-confirm.
 */
export function broadcastAbortPendingLogout(): void {
  if (!supported) return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const message: AbortPendingLogoutMessage = { type: ABORT_PENDING_LOGOUT, sourceId: TAB_ID };
  channel.postMessage(message);
  channel.close();
}

export function subscribeAbortPendingLogout(handler: () => void): () => void {
  if (!supported) return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);
  const listener = (event: MessageEvent) => {
    if (event.data?.type !== ABORT_PENDING_LOGOUT) return;
    if (event.data.sourceId === TAB_ID) return;
    handler();
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
    channel.close();
  };
}
