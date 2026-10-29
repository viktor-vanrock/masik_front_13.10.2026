import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ConversationDto, ConversationSidebarPage } from './types';
import { CONVERSATIONS_QUERY_KEYS } from './queryKeys';
import { useConversationsQuery, useSidebarConversationsQuery } from './queries';
import { listConversations, listSidebarConversations } from './requests';

vi.mock('./requests', () => ({ listConversations: vi.fn(), listSidebarConversations: vi.fn(), getConversation: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

const conversation = (id: string): ConversationDto => ({
  id,
  status: 'active',
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
});

describe('useSidebarConversationsQuery', () => {
  it('keeps pinned and archived payloads and fetches a short first page when more history exists', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first: ConversationSidebarPage = {
      pinned: [conversation('pin')], archived: [conversation('archive')],
      data: [conversation('history-1')], total: 2, pageSize: 20,
    };
    const second: ConversationSidebarPage = {
      pinned: [], archived: [], data: [conversation('history-2')], total: 2, pageSize: 20,
    };
    vi.mocked(listSidebarConversations).mockImplementation(async (page) => page === 1 ? first : second);
    const wrapper = ({ children }: { children: ReactNode }) =>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useSidebarConversationsQuery('alice'), { wrapper });
    await waitFor(() => expect(result.current.data?.pages).toEqual([first]));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => { await result.current.fetchNextPage(); });
    expect(listSidebarConversations).toHaveBeenCalledWith(1);
    expect(listSidebarConversations).toHaveBeenCalledWith(2);
    await waitFor(() => expect(result.current.data?.pages).toEqual([first, second]));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('does not request while disabled and remains scoped to the current user', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const response: ConversationSidebarPage = {
      pinned: [], archived: [], data: [conversation('alice')], total: 1, pageSize: 20,
    };
    vi.mocked(listSidebarConversations).mockResolvedValue(response);
    const { result, rerender } = renderHook(
      ({ userId, enabled }) => useSidebarConversationsQuery(userId, { enabled }),
      { initialProps: { userId: 'alice' as string | null, enabled: false }, wrapper },
    );
    expect(listSidebarConversations).not.toHaveBeenCalled();
    rerender({ userId: 'alice', enabled: true });
    await waitFor(() => expect(result.current.data?.pages).toEqual([response]));
    rerender({ userId: null, enabled: true });
    expect(result.current.data).toBeUndefined();
    expect(listSidebarConversations).toHaveBeenCalledOnce();
  });
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
