import type { ChatMessage } from '@/types';

type MessageExtras = Partial<Omit<ChatMessage, 'id' | 'role' | 'content' | 'timestamp'>>;

const makeId = (): string => crypto.randomUUID();

export function createUserMessage(content: string): ChatMessage {
  return {
    id: makeId(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}

export function createAssistantMessage(
  content: string,
  extras: MessageExtras = {},
  id?: string,
): ChatMessage {
  return {
    id: id ?? makeId(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}