import { CHAT_OUTBOX_PREFIX } from '@/services/auth';
import type { ChatMessage, ChatResponseState, Dialogue, OutgoingChatMessage } from '@/types';

const key = (ownerId: string, conversationId: string) => `${CHAT_OUTBOX_PREFIX}${ownerId}:${conversationId}`;

export function removeOutgoingMessage(ownerId: string, conversationId: string): void {
  try { sessionStorage.removeItem(key(ownerId, conversationId)); } catch { /* The deleted chat is also removed from memory. */ }
}

export function saveOutgoingMessage(ownerId: string, conversationId: string, message: OutgoingChatMessage): void {
  try {
    sessionStorage.setItem(key(ownerId, conversationId), JSON.stringify(message));
  } catch {
    // The in-memory draft still allows a manual retry if browser storage is unavailable.
  }
}

export function readOutgoingMessage(ownerId: string, conversationId: string): OutgoingChatMessage | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(ownerId, conversationId)) ?? 'null');
    if (!value || typeof value.requestId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.requestId)
      || !['text', 'option'].includes(value.kind) || typeof value.value !== 'string'
      || typeof value.timestamp !== 'string' || !Number.isFinite(Date.parse(value.timestamp))
      || (value.label !== undefined && typeof value.label !== 'string')) return null;
    return { ...value, delivery: 'unconfirmed' };
  } catch {
    return null;
  }
}

export function reconcileOutgoingMessage(
  ownerId: string | null,
  conversationId: string,
  current: OutgoingChatMessage | null | undefined,
  serverState: ChatResponseState | null | undefined,
  serverMessages: Array<{ id: string }> = [],
): OutgoingChatMessage | null {
  const outgoing = current ?? (ownerId ? readOutgoingMessage(ownerId, conversationId) : null);
  if (!outgoing) return null;
  if (serverState?.requestId === outgoing.requestId || serverMessages.some((message) => message.id === outgoing.requestId)) {
    if (ownerId) {
      try { sessionStorage.removeItem(key(ownerId, conversationId)); } catch { /* Memory still reconciles. */ }
    }
    return null;
  }
  return outgoing;
}

export function outgoingUserMessage(outgoing: OutgoingChatMessage): ChatMessage {
  return { id: outgoing.requestId, role: 'user', content: outgoing.label ?? outgoing.value, timestamp: outgoing.timestamp };
}

export function restoreOutgoingMessage(
  ownerId: string | null,
  conversationId: string,
  current: OutgoingChatMessage | null | undefined,
  serverState: ChatResponseState | null | undefined,
  messages: ChatMessage[],
  serverMessages: Array<{ id: string }>,
): { outgoingMessage: OutgoingChatMessage | null; messages: ChatMessage[] } {
  const outgoingMessage = reconcileOutgoingMessage(ownerId, conversationId, current, serverState, serverMessages);
  return { outgoingMessage, messages: outgoingMessage && !messages.some((message) => message.id === outgoingMessage.requestId)
    ? [...messages, outgoingUserMessage(outgoingMessage)] : messages };
}

export function interruptOutgoingMessages(dialogues: Dialogue[]): Dialogue[] {
  return dialogues.map((dialogue) => ({ ...dialogue, retryingResponse: false,
    outgoingMessage: dialogue.outgoingMessage ? { ...dialogue.outgoingMessage, delivery: 'unconfirmed' } : null }));
}
