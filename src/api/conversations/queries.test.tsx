import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ConversationDto } from './types';
import { CONVERSATIONS_QUERY_KEYS } from './queryKeys';
import { useConversationsQuery } from './queries';
import { listConversations } from './requests';

vi.mock('./requests', () => ({ listConversations: vi.fn(), getConversation: vi.fn() }));

const conversation = (id: string): ConversationDto => ({
  id,
  status: 'active',
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
});

describe('useConversationsQuery identity boundary', () => {
  it('does not expose the previous user’s cached list while the next user’s request is pending', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const aliceList = [conversation('alice-session')];
    const bobList = [conversation('bob-session')];
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.list('alice'), aliceList);

    let resolveBob!: (value: ConversationDto[]) => void;
    vi.mocked(listConversations).mockReturnValueOnce(new Promise((resolve) => {
      resolveBob = resolve;
    }));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(
      ({ userId }) => useConversationsQuery(userId),
      { initialProps: { userId: 'alice' as string | null }, wrapper },
    );
    expect(result.current.data).toEqual(aliceList);

    rerender({ userId: 'bob' });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(listConversations).toHaveBeenCalledTimes(1));

    resolveBob(bobList);
    await waitFor(() => expect(result.current.data).toEqual(bobList));

    rerender({ userId: null });
    expect(result.current.data).toBeUndefined();
    expect(listConversations).toHaveBeenCalledTimes(1);
  });
});
