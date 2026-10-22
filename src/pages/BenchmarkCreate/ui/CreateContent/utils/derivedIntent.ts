export type DerivedIntent = {
  mode: 'modify' | 'russify';
  baseId: string;
  baseType: 'suite' | 'test';
};

const storageKey = (userId: string, conversationId: string) =>
  `benchmark-derived-intent:${userId}:${conversationId}`;

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
