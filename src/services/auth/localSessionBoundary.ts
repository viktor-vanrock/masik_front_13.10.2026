const LOCAL_LOGOUT_KEY = 'mas_local_logout_barrier';
const AUTH_SESSION_REVISION_KEY = 'mas_auth_session_revision';

// localStorage может быть недоступен (приватный режим/политики) — все операции best-effort.
function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function createSessionRevision(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function markLocalLogout(): void {
  writeStorage(LOCAL_LOGOUT_KEY, '1');
}

export function clearLocalLogout(): void {
  removeStorage(LOCAL_LOGOUT_KEY);
}

export function hasLocalLogoutBarrier(): boolean {
  return readStorage(LOCAL_LOGOUT_KEY) === '1';
}

export function rotateAuthSessionRevision(): void {
  writeStorage(AUTH_SESSION_REVISION_KEY, createSessionRevision());
}

export function readAuthSessionRevision(): string | null {
  return readStorage(AUTH_SESSION_REVISION_KEY);
}
