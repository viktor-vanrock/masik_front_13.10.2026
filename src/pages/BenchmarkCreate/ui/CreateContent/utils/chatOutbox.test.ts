import { describe, expect, it } from 'vitest';
import { CHAT_OUTBOX_PREFIX, clearAuthScopedStorage } from '@/services/auth';
import type { OutgoingChatMessage } from '@/types';
import { readOutgoingMessage, reconcileOutgoingMessage, saveOutgoingMessage } from './chatOutbox';

const outgoing: OutgoingChatMessage = {
  requestId: 'b46eb796-520a-4f8f-bcc6-d90960106918', kind: 'option', value: 'option-1', label: 'Выбранный вариант',
  timestamp: '2026-10-29T10:00:00Z', delivery: 'sending',
};

describe('chat outbox', () => {
  it('isolates drafts by owner and conversation, restores without automatic sending and clears at logout', () => {
    saveOutgoingMessage('alice', 'chat-a', outgoing);
    expect(readOutgoingMessage('bob', 'chat-a')).toBeNull();
    expect(readOutgoingMessage('alice', 'chat-b')).toBeNull();
    expect(readOutgoingMessage('alice', 'chat-a')).toEqual({ ...outgoing, delivery: 'unconfirmed' });
    clearAuthScopedStorage();
    expect(readOutgoingMessage('alice', 'chat-a')).toBeNull();
  });

  it('recognizes an accepted older message even when the latest response state belongs to another turn', () => {
    saveOutgoingMessage('alice', 'chat', outgoing);
    expect(reconcileOutgoingMessage('alice', 'chat', null, null, [{ id: outgoing.requestId }])).toBeNull();
    expect(readOutgoingMessage('alice', 'chat')).toBeNull();
  });

  it('ignores malformed stored data', () => {
    for (const value of ['{', JSON.stringify({ ...outgoing, requestId: '------------------------------------' }), JSON.stringify({ ...outgoing, timestamp: 'bad' })]) {
      sessionStorage.setItem(`${CHAT_OUTBOX_PREFIX}alice:chat`, value);
      expect(readOutgoingMessage('alice', 'chat')).toBeNull();
    }
  });
});
