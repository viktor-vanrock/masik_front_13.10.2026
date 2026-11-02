import type { ChatMessage, ChatResponseState } from '@/types';

export function latestResponseState(
  current: ChatResponseState | null | undefined,
  incoming: ChatResponseState | null | undefined,
  expectedRequestId?: string,
): ChatResponseState | null | undefined {
  if (!incoming) return current ?? incoming;
  if (!current) return incoming;
  if (incoming.requestId !== current.requestId && incoming.requestId === expectedRequestId
    && Date.parse(incoming.updatedAt) >= Date.parse(current.updatedAt)) return incoming;
  if (current.requestId === incoming.requestId) {
    if (current.attempt !== incoming.attempt) return incoming.attempt > current.attempt ? incoming : current;
    // Within one attempt a delayed pending snapshot cannot reopen a settled reply.
    if (current.status !== 'pending' && incoming.status === 'pending') return current;
    if (current.status === 'pending' && incoming.status !== 'pending') return incoming;
    if (current.status === 'pending' && incoming.status === 'pending' && incoming.updatedAt === current.updatedAt && incoming.progress
      && (!current.progress || Date.parse(incoming.progress.updatedAt) > Date.parse(current.progress.updatedAt))) return incoming;
  }
  return Date.parse(incoming.updatedAt) > Date.parse(current.updatedAt) ? incoming : current;
}

export function responseErrorMessage(state: ChatResponseState, fallback: string): ChatMessage {
  return {
    id: `response-error-${state.requestId}-${state.attempt}`,
    role: 'assistant',
    content: state.error?.message || fallback,
    timestamp: state.updatedAt,
  };
}
