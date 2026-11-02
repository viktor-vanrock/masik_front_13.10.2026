import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { ConversationDto, ConversationSidebarPage, ConversationDetailDto } from './types';
import { CONVERSATIONS_QUERY_KEYS } from './queryKeys';
import { useArchivedConversationsQuery, useConversationsQuery, useSidebarConversationsQuery, useConversationDetailQuery, refreshConversationDetail, removeConversationFromCache } from './queries';
import { setQueryClient, resetQueryClient } from '@/services/query';
import { listArchivedConversations, listConversations, listSidebarConversations, getConversation } from './requests';

vi.mock('./requests', () => ({ listConversations: vi.fn(), listSidebarConversations: vi.fn(), listArchivedConversations: vi.fn(), getConversation: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
afterEach(() => resetQueryClient());

describe('conversation specification snapshots', () => {
  it('removes all deleted chat caches only for their owner while preserving paginated totals', async () => {
    const client = new QueryClient(); setQueryClient(client);
    const first = conversation('first'), second = conversation('second');
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.list('alice'), [first, second]);
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.list('bob'), [first]);
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.sidebar('alice'), { pageParams: [1, 2], pages: [
      { pinned: [], data: [first], total: 2, pageSize: 1, hasNextPage: true },
      { pinned: [], data: [second], total: 2, pageSize: 1, hasNextPage: false },
    ] });
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.archive('alice'), { pageParams: [1], pages: [{ data: [first], total: 1, pageSize: 20, hasNextPage: false }] });
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.detail('alice', 'first'), first);
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.generation('alice', 'first'), { jobId: 'job' });
    client.setQueryData(CONVERSATIONS_QUERY_KEYS.detail('bob', 'first'), first);
    await removeConversationFromCache('alice', 'first');
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.list('alice'))).toEqual([second]);
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.list('bob'))).toEqual([first]);
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.detail('alice', 'first'))).toBeUndefined();
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.generation('alice', 'first'))).toBeUndefined();
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.detail('bob', 'first'))).toEqual(first);
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.sidebar('alice'))).toMatchObject({ pages: [{ data: [], total: 1 }, { data: [second], total: 1 }] });
    expect(client.getQueryData(CONVERSATIONS_QUERY_KEYS.archive('alice'))).toMatchObject({ pages: [{ data: [], total: 0 }] });
    client.clear();
  });
  it('restores deferred readiness only from the current owner and conversation snapshot', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setQueryClient(client);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const detail = (id: string, ready = false): ConversationDetailDto => ({ ...conversation(id), messages: [], recommendations: [], recommendationRequests: [],
      ...(ready ? { demoRequest: { status: 'ready', revision: 'revision-1' } } : {}) });
    let finishOld!: (value: ConversationDetailDto) => void;
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const { result, rerender, unmount } = renderHook(({ id, owner }) => useConversationDetailQuery(id, owner),
      { wrapper, initialProps: { id: 'first', owner: 'alice' as string | null } });
    await waitFor(() => expect(getConversation).toHaveBeenCalledOnce());
    expect(result.current.data?.demoRequest).toBeUndefined();
    vi.mocked(getConversation).mockResolvedValueOnce(detail('first', true));
    await act(async () => { await refreshConversationDetail('alice', 'first'); });
    await waitFor(() => expect(result.current.data?.demoRequest).toEqual({ status: 'ready', revision: 'revision-1' }));
    await act(async () => { finishOld(detail('first')); });
    expect(result.current.data?.demoRequest?.status).toBe('ready');
    vi.mocked(getConversation).mockResolvedValueOnce(detail('second'));
    rerender({ id: 'second', owner: 'alice' });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data?.id).toBe('second'));
    expect(result.current.data?.demoRequest).toBeUndefined();
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(() => {}));
    rerender({ id: 'first', owner: 'bob' });
    expect(result.current.data).toBeUndefined();
    rerender({ id: 'first', owner: null });
    expect(result.current.data).toBeUndefined();
    unmount(); client.clear();
  });

  it('refreshes a pending first snapshot when the model saves requirements before it resolves', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    setQueryClient(client);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    let finishOld!: (value: ConversationDetailDto) => void;
    const detail = (specification = {}): ConversationDetailDto => ({ ...conversation('first'), messages: [], recommendations: [], recommendationRequests: [], specification });
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(resolve => { finishOld = resolve; }));
    const { result, unmount } = renderHook(() => useConversationDetailQuery('first', 'alice'), { wrapper });
    await waitFor(() => expect(getConversation).toHaveBeenCalledOnce());
    vi.mocked(getConversation).mockResolvedValueOnce(detail({ language: 'Русский' }));
    await act(async () => { await refreshConversationDetail('alice', 'first'); });
    await waitFor(() => expect(result.current.data?.specification).toEqual({ language: 'Русский' }));
    await act(async () => { finishOld(detail()); });
    expect(result.current.data?.specification).toEqual({ language: 'Русский' });
    expect(getConversation).toHaveBeenCalledTimes(2);
    unmount(); client.clear();
  });
  it('refreshes when returning to a chat updated while another chat was open', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const detail = (id: string, specification = {}): ConversationDetailDto => ({ ...conversation(id), messages: [], recommendations: [], recommendationRequests: [], specification });
    vi.mocked(getConversation).mockResolvedValueOnce(detail('first', { language: 'Русский' }));
    const { result, rerender, unmount } = renderHook(({ id }) => useConversationDetailQuery(id, 'alice'), { wrapper, initialProps: { id: 'first' } });
    await waitFor(() => expect(result.current.data?.specification?.language).toBe('Русский'));
    vi.mocked(getConversation).mockResolvedValueOnce(detail('second'));
    rerender({ id: 'second' });
    await waitFor(() => expect(result.current.data?.id).toBe('second'));
    vi.mocked(getConversation).mockResolvedValueOnce(detail('first', { language: 'Английский' }));
    rerender({ id: 'first' });
    await waitFor(() => expect(result.current.data?.specification?.language).toBe('Английский'));
    unmount(); client.clear();
  });
  it('replaces removed fields on refresh and isolates conversations and owners', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const detail = (id: string, specification = {}): ConversationDetailDto => ({ ...conversation(id), messages: [], recommendations: [], recommendationRequests: [], specification });
    vi.mocked(getConversation).mockResolvedValueOnce(detail('first', { goal: 'BMW', language: 'Русский' }));
    const { result, rerender, unmount } = renderHook(({ id, owner }) => useConversationDetailQuery(id, owner), { wrapper, initialProps: { id: 'first', owner: 'alice' as string | null } });
    await waitFor(() => expect(result.current.data?.specification?.language).toBe('Русский'));
    vi.mocked(getConversation).mockResolvedValueOnce(detail('first', { goal: 'BMW' }));
    await act(async () => { await client.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.detail('alice', 'first'), exact: true }); });
    await waitFor(() => expect(result.current.data?.specification).toEqual({ goal: 'BMW' }));
    let finish!: (value: ConversationDetailDto) => void;
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    rerender({ id: 'second', owner: 'alice' });
    expect(result.current.data).toBeUndefined();
    await act(async () => { finish(detail('second', { goal: 'Финансы' })); });
    await waitFor(() => expect(result.current.data?.specification?.goal).toBe('Финансы'));
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(() => {}));
    rerender({ id: 'second', owner: 'bob' });
    expect(result.current.data).toBeUndefined();
    rerender({ id: 'second', owner: null });
    expect(result.current.data).toBeUndefined();
    unmount(); client.clear();
  });
});

const conversation = (id: string): ConversationDto => ({
  id,
  status: 'active',
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
});

describe('useSidebarConversationsQuery', () => {
  it('keeps pinned chats and fetches a short first page when more history exists', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first: ConversationSidebarPage = {
      pinned: [conversation('pin')],
      data: [conversation('history-1')], total: 2, pageSize: 20, hasNextPage: true,
    };
    const second: ConversationSidebarPage = {
      pinned: [], data: [conversation('history-2')], total: 2, pageSize: 20, hasNextPage: false,
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
      pinned: [], data: [conversation('alice')], total: 1, pageSize: 20, hasNextPage: false,
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

describe('useArchivedConversationsQuery', () => {
  it('loads archive pages until hasNextPage is false', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const first = { data: [conversation('archive-1')], total: 2, pageSize: 20, hasNextPage: true };
    const second = { data: [conversation('archive-2')], total: 2, pageSize: 20, hasNextPage: false };
    vi.mocked(listArchivedConversations).mockImplementation(async (page) => page === 1 ? first : second);
    const wrapper = ({ children }: { children: ReactNode }) =>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useArchivedConversationsQuery('alice'), { wrapper });
    await waitFor(() => expect(result.current.data?.pages).toEqual([first]));
    await act(async () => { await result.current.fetchNextPage(); });
    await waitFor(() => expect(result.current.data?.pages).toEqual([first, second]));
    expect(result.current.hasNextPage).toBe(false);
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
