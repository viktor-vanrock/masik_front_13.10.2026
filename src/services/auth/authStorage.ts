// Единственный источник правды для user/auth-scoped browser storage (sessionStorage и
// localStorage). Значения снимаются синхронно на каждой границе auth-сессии — не
// читайте/пишите эти ключи в обход этого модуля.

export const CONV_SESSION_KEY = 'mas_active_conversation_id';
export const CONV_STATUS_KEY = 'mas_active_conversation_status';
export const CONV_OWNER_KEY = 'mas_active_conversation_owner_id';
export const CONV_NAMES_KEY = 'mas_conv_names';
export const ENTRY_SESSION_PREFIX = 'benchmark-entry-session:';
export const DERIVED_INTENT_PREFIX = 'benchmark-derived-intent:';

const AUTH_SCOPED_SESSION_KEYS = [CONV_SESSION_KEY, CONV_STATUS_KEY, CONV_OWNER_KEY] as const;
const AUTH_SCOPED_LOCAL_KEYS = [CONV_NAMES_KEY] as const;

/** Синхронно чистит все user/auth-scoped ключи (session- и localStorage) на границе auth-сессии. */
export function clearAuthScopedStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of AUTH_SCOPED_SESSION_KEYS) {
      window.sessionStorage.removeItem(key);
    }
    for (let index = window.sessionStorage.length - 1; index >= 0; index--) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(ENTRY_SESSION_PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage может быть недоступен (приватный режим/политики) — best-effort.
  }
  try {
    for (const key of AUTH_SCOPED_LOCAL_KEYS) {
      window.localStorage.removeItem(key);
    }
    for (let index = window.localStorage.length - 1; index >= 0; index--) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(DERIVED_INTENT_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // localStorage может быть недоступен — best-effort.
  }
}
