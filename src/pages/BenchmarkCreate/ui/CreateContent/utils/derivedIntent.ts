import { DERIVED_INTENT_PREFIX, ENTRY_SESSION_PREFIX } from '@/services/auth';

export type DerivedIntent = {
  mode: 'modify' | 'russify';
  baseId: string;
  baseType: 'suite' | 'test';
};

const entrySessionKey = (userId: string, entryIntentKey: string) =>
  `${ENTRY_SESSION_PREFIX}${encodeURIComponent(userId)}:${encodeURIComponent(entryIntentKey)}`;

export function saveEntrySession(userId: string, entryIntentKey: string, conversationId: string): void {
  try {
    sessionStorage.setItem(entrySessionKey(userId, entryIntentKey), conversationId);
  } catch {
    // The conversation remains available through its URL and the regular history.
  }
}

export function loadEntrySession(userId: string, entryIntentKey: string): string | null {
  try {
    return sessionStorage.getItem(entrySessionKey(userId, entryIntentKey));
  } catch {
    return null;
  }
}

export function removeEntrySession(userId: string, entryIntentKey: string): void {
  try {
    sessionStorage.removeItem(entrySessionKey(userId, entryIntentKey));
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

const storageKey = (userId: string, conversationId: string) =>
  `${DERIVED_INTENT_PREFIX}${userId}:${conversationId}`;

export function saveDerivedIntent(userId: string, conversationId: string, intent: DerivedIntent): void {
  try {
    localStorage.setItem(storageKey(userId, conversationId), JSON.stringify(intent));
  } catch {
    // The current chat remains usable even when browser storage is unavailable.
  }
}

export function loadDerivedIntent(userId: string | undefined, conversationId: string | null): DerivedIntent | null {
  if (!userId || !conversationId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, conversationId));
    if (!raw) return null;
    const intent: unknown = JSON.parse(raw);
    if (!intent || typeof intent !== 'object') return null;
    const value = intent as Partial<DerivedIntent>;
    if ((value.mode !== 'modify' && value.mode !== 'russify') ||
      (value.baseType !== 'suite' && value.baseType !== 'test') ||
      typeof value.baseId !== 'string' || !value.baseId) return null;
    return value as DerivedIntent;
  } catch {
    return null;
  }
}
