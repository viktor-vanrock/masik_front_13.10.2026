import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { deleteConversation, getConversation, updateConversation } from '@/api/conversations';
import type { ConversationDetailDto } from '@/api/conversations';
import type { ChatResponseState } from '@/types';
import { CONV_SESSION_KEY, CONV_OWNER_KEY, CONV_STATUS_KEY } from '@/services/auth';
import { ApiException } from '@/services/http';
import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@/services/socket';
import { useConversation } from './useConversation';
import { readOutgoingMessage, saveOutgoingMessage } from '../../utils/chatOutbox';
import { QueryClient } from '@tanstack/react-query';
import { setQueryClient, resetQueryClient } from '@/services/query';

const state = vi.hoisted(() => ({
  userId: 'alice',
  sidebarPinnedDate: null as string | null,
  handlers: new Map<string, (payload: unknown) => void>(),
  socket: {
    connected: true,
    on: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), removeAllListeners: vi.fn(), emit: vi.fn(),
  },
  generation: undefined as { jobId: string; status: string } | undefined,
}));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru, status: 'authenticated', user: { id: state.userId } }) }));
vi.mock('@/api/conversations', async (original) => ({
  ...await original<typeof import('@/api/conversations')>(),
  useSidebarConversationsQuery: () => ({ data: { pages: [{ pinned: [], data: [{ id: 'conversation', status: 'awaiting_choice', pinnedDate: state.sidebarPinnedDate, createdAt: '', updatedAt: '' }], total: 1, archived: [] }] }, fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false }),
  useArchivedConversationsQuery: () => ({ data: { pages: [{ data: [], total: 0, pageSize: 20, hasNextPage: false }] }, fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false }),
  getConversation: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));
vi.mock('@/services/socket', async (original) => ({
  ...await original<typeof import('@/services/socket')>(), createChatSocket: () => state.socket,
}));
vi.mock('../useGeneration', () => ({ useGeneration: () => ({ generation: state.generation }) }));
vi.mock('../useProduction', () => ({ useProduction: () => ({ production: undefined }) }));
const detail: ConversationDetailDto = {
  id: 'conversation', status: 'awaiting_choice', intent: 'find_existing', createdAt: '', updatedAt: '',
  messages: [], recommendations: [], recommendationRequests: [],
};
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

beforeEach(() => {
  vi.clearAllMocks();
  state.socket.emit.mockReset();
  state.userId = 'alice';
  state.sidebarPinnedDate = null;
  state.handlers.clear();
  state.generation = undefined;
  state.socket.connected = true;
  state.socket.on.mockImplementation((event, handler) => { state.handlers.set(event, handler); });
  vi.mocked(getConversation).mockResolvedValue(detail);
  vi.mocked(updateConversation).mockReset().mockResolvedValue(detail);
  vi.mocked(deleteConversation).mockReset().mockResolvedValue(undefined);
});

afterEach(() => { vi.useRealTimers(); resetQueryClient(); });

async function restore() {
  sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
  sessionStorage.setItem(CONV_OWNER_KEY, 'alice');
  const hook = renderHook(() => useConversation(), { wrapper });
  await waitFor(() => expect(hook.result.current.activeId).toBe(detail.id));
  return hook;
}

describe('useConversation integrated contracts', () => {
  it('keeps a failed deletion intact and allows a successful active delete with no automatic replacement', async () => {
    const { result } = await restore();
    vi.mocked(deleteConversation).mockRejectedValueOnce(new Error('offline'));
    await act(async () => { await expect(result.current.deleteDialogue(detail.id)).rejects.toThrow('offline'); });
    expect(result.current.activeId).toBe(detail.id);
    expect(result.current.dialogues.some(dialogue => dialogue.id === detail.id)).toBe(true);
    saveOutgoingMessage('alice', detail.id, { requestId: '11111111-1111-4111-8111-111111111111', kind: 'text', value: 'Не отправлять', timestamp: new Date().toISOString(), delivery: 'unconfirmed' });
    state.socket.emit.mockClear();
    await act(async () => { await result.current.deleteDialogue(detail.id); });
    expect(result.current.activeId).toBeNull();
    expect(result.current.dialogues.some(dialogue => dialogue.id === detail.id)).toBe(false);
    expect(readOutgoingMessage('alice', detail.id)).toBeNull();
    expect(sessionStorage.getItem(CONV_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(CONV_OWNER_KEY)).toBeNull();
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBeNull();
    expect(state.socket.emit).not.toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_CHAT, {});
    act(() => state.handlers.get(WS_SERVER_EVENTS.RESPONSE_STATE)?.({ conversationId: detail.id,
      responseState: pendingResponse() }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.CHAT_STARTED)?.({ conversationId: detail.id }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({ conversationId: detail.id, type: 'message', id: 'late', isFinal: false, content: { kind: 'text', label: 'Late frame' } }));
    expect(result.current.activeId).toBeNull();
    expect(result.current.dialogues.some(dialogue => dialogue.id === detail.id)).toBe(false);
  });

  it('does not resurrect a deleted conversation when an older hydration GET finishes', async () => {
    const { result, rerender } = await restore();
    let finish!: (value: ConversationDetailDto) => void;
    vi.mocked(getConversation).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    act(() => result.current.selectDialogue(detail.id));
    await act(async () => { await result.current.deleteDialogue(detail.id); });
    await act(async () => { finish(detail); });
    rerender();
    expect(result.current.activeId).toBeNull();
    expect(result.current.dialogues).toEqual([]);
    expect(sessionStorage.getItem(CONV_SESSION_KEY)).toBeNull();
  });

  it('deleting an inactive chat preserves the current active session and draft outbox', async () => {
    const { result } = await restore();
    saveOutgoingMessage('alice', detail.id, { requestId: '11111111-1111-4111-8111-111111111111', kind: 'text', value: 'Keep draft', timestamp: new Date().toISOString(), delivery: 'unconfirmed' });
    state.socket.disconnect.mockClear();
    await act(async () => { await result.current.deleteDialogue('other-chat'); });
    expect(result.current.activeId).toBe(detail.id);
    expect(sessionStorage.getItem(CONV_SESSION_KEY)).toBe(detail.id);
    expect(readOutgoingMessage('alice', detail.id)?.value).toBe('Keep draft');
    expect(state.socket.disconnect).not.toHaveBeenCalled();
  });

  it('refreshes the correct specification for every agent bubble, duplicate delivery and reconnect', async () => {
    const client = new QueryClient();
    setQueryClient(client);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    await restore();
    act(() => state.handlers.get('connect')?.({}));
    invalidate.mockClear();
    const message = { conversationId: detail.id, type: 'message', id: 'reply', isFinal: false, content: { kind: 'text', label: 'Сохранил язык' } };
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.(message));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.(message));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
    expect(invalidate).toHaveBeenNthCalledWith(1, { queryKey: ['conversations', 'detail', 'alice', detail.id], exact: true });
    expect(invalidate).toHaveBeenNthCalledWith(2, { queryKey: ['conversations', 'detail', 'alice', detail.id], exact: true });
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({ ...message, conversationId: 'other-chat' }));
    await waitFor(() => expect(invalidate).toHaveBeenLastCalledWith({ queryKey: ['conversations', 'detail', 'alice', 'other-chat'], exact: true }));
    act(() => state.handlers.get('connect')?.({}));
    await waitFor(() => expect(invalidate).toHaveBeenLastCalledWith({ queryKey: ['conversations', 'detail', 'alice', detail.id], exact: true }));
    client.clear();
  });
  it('ignores a dialogue ID that is absent from both the local and server lists', async () => {
    const { result } = await restore();
    vi.mocked(getConversation).mockClear();
    act(() => result.current.selectDialogue('missing-dialogue'));
    expect(result.current.activeId).toBe(detail.id);
    expect(getConversation).not.toHaveBeenCalled();
  });

  it('pins optimistically, blocks duplicate requests, and uses the server pin date', async () => {
    const { result } = await restore();
    let finish!: (value: typeof detail) => void;
    vi.mocked(updateConversation).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));

    act(() => {
      void result.current.togglePin(detail.id);
      void result.current.togglePin(detail.id);
    });
    expect(result.current.activeDialogue?.pinnedDate).toBeTruthy();
    expect(updateConversation).toHaveBeenCalledTimes(1);
    expect(updateConversation).toHaveBeenCalledWith(detail.id, { isPinned: true });

    await act(async () => { finish({ ...detail, pinnedDate: '2026-10-29T15:00:00.000Z', updatedAt: '2026-10-29T15:01:00.000Z' }); });
    expect(result.current.activeDialogue?.pinnedDate).toBe('2026-10-29T15:00:00.000Z');
    expect(result.current.activeDialogue?.updatedAt).toBe('2026-10-29T15:01:00.000Z');
  });

  it('restores the original pin and updated time if the request fails', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, pinnedDate: '2026-10-28T12:00:00.000Z' });
    const { result } = await restore();
    vi.mocked(updateConversation).mockRejectedValueOnce(new Error('network'));

    await act(async () => { await result.current.togglePin(detail.id); });
    expect(result.current.activeDialogue?.pinnedDate).toBe('2026-10-28T12:00:00.000Z');
    expect(result.current.activeDialogue?.updatedAt).toBe(detail.updatedAt);
    expect(result.current.connectionError).toContain('Не удалось изменить закрепление');
  });

  it.each(['hydration', 'selection', 'polling', 'recommendation'])('keeps a confirmed pin when an older %s GET finishes', async (source) => {
    let finishGet!: (value: ConversationDetailDto) => void;
    const pendingGet = new Promise<ConversationDetailDto>((resolve) => { finishGet = resolve; });
    let hook: Awaited<ReturnType<typeof restore>>;
    if (source === 'hydration') {
      vi.mocked(getConversation).mockReturnValueOnce(pendingGet);
      sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
      sessionStorage.setItem(CONV_OWNER_KEY, 'alice');
      hook = renderHook(() => useConversation(), { wrapper });
    } else {
      hook = await restore();
      vi.mocked(getConversation).mockReturnValueOnce(pendingGet);
      if (source === 'selection') {
        act(() => hook.result.current.selectDialogue(detail.id));
      } else {
        vi.useFakeTimers();
        if (source === 'polling') {
          responseEvent(detail.id, pendingResponse());
          await act(async () => vi.advanceTimersByTimeAsync(5_000));
        } else {
          act(() => state.handlers.get(WS_SERVER_EVENTS.RECOMMENDATION_UPDATED)?.({
            id: 'recommendation', testId: 'test', conversationId: detail.id, status: 'rejected', createdAt: '', updatedAt: '',
          }));
          await act(async () => vi.advanceTimersByTimeAsync(1_200));
        }
      }
    }
    const pinned = { ...detail, pinnedDate: '2026-10-29T15:00:00Z', updatedAt: '2026-10-29T15:00:00Z' };
    vi.mocked(updateConversation).mockResolvedValueOnce(pinned);
    await act(async () => { await hook.result.current.togglePin(detail.id); });
    await act(async () => { finishGet(detail); });
    expect(hook.result.current.dialogues.find((dialogue) => dialogue.id === detail.id)).toMatchObject({
      pinnedDate: pinned.pinnedDate, updatedAt: pinned.updatedAt,
    });
    await act(async () => { await hook.result.current.togglePin(detail.id); });
    expect(updateConversation).toHaveBeenLastCalledWith(detail.id, { isPinned: false });
  });

  it('keeps an unpin when a GET started during its request returns the old pin', async () => {
    const pinned = { ...detail, pinnedDate: '2026-10-28T12:00:00Z' };
    vi.mocked(getConversation).mockResolvedValue(pinned);
    const { result } = await restore();
    let finishPin!: (value: ConversationDetailDto) => void;
    vi.mocked(updateConversation).mockReturnValueOnce(new Promise((resolve) => { finishPin = resolve; }));
    act(() => { void result.current.togglePin(detail.id); });
    let finishGet!: (value: ConversationDetailDto) => void;
    vi.mocked(getConversation).mockReturnValueOnce(new Promise((resolve) => { finishGet = resolve; }));
    act(() => result.current.selectDialogue(detail.id));
    await act(async () => { finishPin({ ...detail, pinnedDate: null }); });
    await act(async () => { finishGet(pinned); });
    expect(result.current.activeDialogue?.pinnedDate).toBeNull();
  });
  it('clears owner/session/status and typing when identity changes without a remount', async () => {
    const { result, rerender } = await restore();
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBe('awaiting_choice');
    state.userId = 'bob';
    rerender();
    expect(result.current.activeId).toBeNull();
    expect(result.current.isTyping).toBe(false);
    expect(sessionStorage.getItem(CONV_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(CONV_OWNER_KEY)).toBeNull();
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBeNull();
  });

  it('can explicitly start creation from an authorized awaiting-choice conversation', async () => {
    const { result } = await restore();
    act(() => result.current.skipRecommendToCreate());
    expect(state.socket.emit).toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_BENCHMARK_CREATION, { conversationId: detail.id });
    expect(state.socket.emit).toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_CHAT, { conversationId: detail.id });
  });

  it('never resumes a stale conversation owned by another account', () => {
    sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
    sessionStorage.setItem(CONV_OWNER_KEY, 'bob');
    const { result } = renderHook(() => useConversation(), { wrapper });
    expect(result.current.activeId).toBeNull();
    expect(getConversation).not.toHaveBeenCalled();
    expect(state.socket.emit).not.toHaveBeenCalled();
  });

  it('does not restore or resume a session when REST denies access', async () => {
    vi.mocked(getConversation).mockRejectedValue(new ApiException({ statusCode: 403, message: 'Forbidden', error: 'Forbidden' }));
    sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
    sessionStorage.setItem(CONV_OWNER_KEY, 'alice');
    const { result } = renderHook(() => useConversation(), { wrapper });
    await waitFor(() => expect(sessionStorage.getItem(CONV_SESSION_KEY)).toBeNull());
    expect(result.current.activeId).toBeNull();
    expect(state.socket.emit).not.toHaveBeenCalled();
  });

  it('resumes ordinary chat once for an authorized generating conversation', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, intent: 'create_new', status: 'generating' });
    state.generation = { jobId: 'creator-job', status: 'running' };
    const { result } = await restore();
    expect(result.current.activeDialogue?.conversationStatus).toBe('generating');
    act(() => state.handlers.get('connect')?.(undefined));
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.START_CHAT)).toHaveLength(1);
  });

  it('preserves automatic creation after rejecting a recommendation', async () => {
    const { result } = await restore();
    act(() => state.handlers.get(WS_SERVER_EVENTS.RECOMMENDATION_UPDATED)?.({
      id: 'rejected', testId: 'test', conversationId: detail.id, status: 'rejected', createdAt: '', updatedAt: '',
    }));
    expect(result.current.activeDialogue).toMatchObject({ phase: 'create', conversationStatus: 'active' });
  });

  it('retains test IDs, explanations and separate actions for multiple socket recommendations', async () => {
    const { result } = await restore();
    const recommendations = ['test-a', 'test-b'].map((testId, index) => ({
      id: `rec-${index}`, testId, conversationId: detail.id, status: 'pending', createdAt: '', updatedAt: '',
    }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.RECOMMENDATION_RESULT)?.({
      status: 'completed', requestId: 'request', conversationId: detail.id, recommendations,
      retrievalVersion: 'version', explanations: [{ testId: 'test-b', explanation: 'Useful explanation' }],
    }));
    const message = result.current.activeDialogue?.messages.at(-1);
    expect(message).toMatchObject({ content: 'Useful explanation', recommendations: ['test-a', 'test-b'],
      recommendationItems: [{ id: 'rec-0', testId: 'test-a' }, { id: 'rec-1', testId: 'test-b' }] });
    act(() => state.handlers.get(WS_SERVER_EVENTS.RECOMMENDATION_UPDATED)?.({ ...recommendations[1], status: 'selected' }));
    const updated = result.current.activeDialogue?.messages.find((item) => item.id === message?.id);
    expect(updated?.recommendationItems?.map((item) => item.status)).toEqual(['pending', 'selected']);
  });
});

const pendingResponse = (requestId = 'request-1', overrides: Partial<ChatResponseState> = {}): ChatResponseState => ({
  requestId, userMessageId: requestId, status: 'pending', attempt: 1, error: null,
  updatedAt: '2026-10-29T10:00:00.000Z', ...overrides,
});

function responseEvent(conversationId: string, responseState: ChatResponseState) {
  act(() => state.handlers.get(WS_SERVER_EVENTS.RESPONSE_STATE)?.({ conversationId, responseState }));
}

describe('durable chat response state', () => {
  it('restores durable brief stages, keeps them offline and accepts a newer REST snapshot on reconnect', async () => {
    const pending = pendingResponse('request-brief', { progress: { stage: 'compose', message: 'Готовим бриф', updatedAt: '2026-11-02T10:00:00Z' } });
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pending });
    const first = await restore();
    expect(first.result.current.briefProgress).toEqual(pending.progress);
    act(() => state.handlers.get('connect')?.(undefined));
    act(() => state.handlers.get('disconnect')?.(undefined));
    expect(first.result.current.socketConnected).toBe(false);
    expect(first.result.current.responsePending).toBe(true);
    expect(first.result.current.briefProgress).toEqual(pending.progress);
    const saved = { ...pending, updatedAt: '2026-11-02T10:00:02Z', progress: {
      stage: 'save' as const, message: 'Сохраняем бриф', updatedAt: '2026-11-02T10:00:02Z',
    } };
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: saved });
    act(() => state.handlers.get('connect')?.(undefined));
    await waitFor(() => expect(first.result.current.briefProgress).toEqual(saved.progress));
    first.unmount();
    const reloaded = await restore();
    expect(reloaded.result.current.briefProgress).toEqual(saved.progress);
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('scopes durable stages to the current request attempt and clears them on retry or terminal state', async () => {
    const current = pendingResponse('request-brief', { attempt: 2, progress: {
      stage: 'validate', message: 'Проверяем бриф', updatedAt: '2026-11-02T10:00:00Z',
    } });
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: current });
    const { result } = await restore();
    responseEvent(detail.id, { ...current, attempt: 1, updatedAt: '2026-11-02T11:00:00Z', progress: {
      stage: 'save', message: 'Старое сохранение', updatedAt: '2026-11-02T11:00:00Z',
    } });
    responseEvent('other-chat', { ...current, requestId: 'other-request', progress: {
      stage: 'retry', message: 'Другой чат', updatedAt: '2026-11-02T10:00:01Z',
    } });
    expect(result.current.briefProgress).toEqual(current.progress);
    responseEvent(detail.id, { ...current, attempt: 3, progress: undefined });
    expect(result.current.briefProgress).toBeUndefined();
    expect(result.current.responsePending).toBe(true);
    responseEvent(detail.id, { ...current, attempt: 3, status: 'responded' });
    expect(result.current.briefProgress).toBeUndefined();
    expect(result.current.responsePending).toBe(false);
  });

  it('keeps intermediate meaningful replies visible without ending transient waiting or completing the chat', async () => {
    const { result } = await restore();
    act(() => result.current.skipRecommendToCreate());
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'result', id: 'intermediate', isFinal: true, turnComplete: false,
      content: { kind: 'result', label: 'Требования собраны, готовим бриф', status: 'done' },
    }));
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe('Требования собраны, готовим бриф');
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.conversationStatus).not.toBe('completed');
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).not.toBe('completed');
  });

  it('keeps waiting for a brief after intermediate recommendations', async () => {
    const { result } = await restore();
    act(() => result.current.skipRecommendToCreate());
    act(() => state.handlers.get(WS_SERVER_EVENTS.RECOMMENDATION_RESULT)?.({
      conversationId: detail.id, requestId: 'catalog-result', status: 'completed', turnComplete: false,
      label: 'Проверили каталог, продолжаем подготовку', recommendations: [],
    }));
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.conversationStatus).toBe('awaiting_choice');
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe('Проверили каталог, продолжаем подготовку');
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBe('awaiting_choice');
  });

  it('clears a transport error only when fresh progress matches the active pending request', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse('request-a', { attempt: 2 }) });
    const { result } = await restore();
    const progress = (overrides = {}) => act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_PROGRESS)?.({
      conversationId: detail.id, requestId: 'request-a', attempt: 2, message: 'Ищем в каталоге', ...overrides,
    }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'error', isFinal: true, content: { message: 'Соединение прервано' },
    }));
    progress({ conversationId: 'another-chat' });
    progress({ requestId: 'another-request' });
    progress({ attempt: 1 });
    expect(result.current.connectionError).toBe('Соединение прервано');
    progress();
    expect(result.current.connectionError).toBeNull();
    expect(result.current.responseProgress).toBe('Ищем в каталоге');
    expect(result.current.responsePending).toBe(true);
  });

  it('shows only progress correlated with the pending attempt, routes inactive stages and clears after settlement', async () => {
    const pending = pendingResponse('request-a', { attempt: 2 });
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pending });
    const { result } = await restore();
    const progress = (overrides = {}) => act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_PROGRESS)?.({
      conversationId: detail.id, requestId: pending.requestId, attempt: pending.attempt, message: 'Проверяем каталог', ...overrides,
    }));
    expect(result.current.responsePending).toBe(true);
    expect(result.current.responseProgress).toBeNull();
    progress({ requestId: 'old-request' });
    progress({ attempt: 1 });
    progress({ message: '  ' });
    expect(result.current.responseProgress).toBeNull();
    progress();
    expect(result.current.responseProgress).toBe('Проверяем каталог');
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages).toHaveLength(0);
    responseEvent(detail.id, { ...pending, attempt: 1, status: 'responded' });
    expect(result.current.responseProgress).toBe('Проверяем каталог');
    act(() => result.current.startNewSession());
    act(() => state.handlers.get(WS_SERVER_EVENTS.CHAT_STARTED)?.({ conversationId: 'conversation-b' }));
    progress({ message: 'Читаем найденные результаты' });
    expect(result.current.responseProgress).toBeNull();
    expect(result.current.dialogues.find((dialogue) => dialogue.id === detail.id)?.responseProgress?.message).toBe('Читаем найденные результаты');
    responseEvent(detail.id, { ...pending, status: 'responded' });
    progress({ message: 'Слишком поздний этап' });
    expect(result.current.dialogues.find((dialogue) => dialogue.id === detail.id)?.responseProgress).toBeNull();
  });

  it('restores generic pending after reload and discards a previously displayed stage on disconnect', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse() });
    const first = await restore();
    act(() => state.handlers.get('connect')?.(undefined));
    expect(first.result.current.socketConnected).toBe(true);
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_PROGRESS)?.({
      conversationId: detail.id, requestId: 'request-1', attempt: 1, message: 'Изучаем запрос',
    }));
    expect(first.result.current.responseProgress).toBe('Изучаем запрос');
    act(() => state.handlers.get('disconnect')?.(undefined));
    expect(first.result.current.socketConnected).toBe(false);
    expect(first.result.current.responsePending).toBe(true);
    expect(first.result.current.responseProgress).toBeNull();
    first.unmount();
    const second = await restore();
    expect(second.result.current.responsePending).toBe(true);
    expect(second.result.current.responseProgress).toBeNull();
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('recovers a missed reply from REST on reconnect without resending', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse() });
    const { result } = await restore();
    act(() => state.handlers.get('connect')?.(undefined));
    act(() => state.handlers.get('disconnect')?.(undefined));
    vi.mocked(getConversation).mockResolvedValue({ ...detail,
      responseState: pendingResponse('request-1', { status: 'responded' }),
      messages: [{ id: 'missed-answer', role: 'agent', kind: 'text', content: 'Ответ при отключении', options: null, createdAt: pendingResponse().updatedAt }],
    });
    await act(async () => state.handlers.get('connect')?.(undefined));
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activeDialogue?.messages.map((message) => message.content)).toEqual(['Ответ при отключении']);
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('recovers a reply saved on another replica and stops polling after it settles', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse() });
    const { result } = await restore();
    vi.useFakeTimers();
    // Restart the effect using fake timers while keeping an ordinary pending turn.
    responseEvent(detail.id, pendingResponse('request-1', { status: 'responded' }));
    responseEvent(detail.id, pendingResponse('request-2', { updatedAt: '2026-10-29T10:01:00Z' }));
    vi.mocked(getConversation).mockResolvedValue({ ...detail,
      responseState: pendingResponse('request-2', { status: 'responded', updatedAt: '2026-10-29T10:01:01Z' }),
      messages: [{ id: 'polled-answer', role: 'agent', kind: 'text', content: 'Ответ из истории', options: null, createdAt: '2026-10-29T10:01:01Z' }],
    });
    vi.mocked(getConversation).mockClear();
    await act(async () => vi.advanceTimersByTimeAsync(5_000));
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe('Ответ из истории');
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(getConversation).toHaveBeenCalledTimes(1);
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('keeps an uncorrelated transport error separate from the pending response', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse() });
    const { result } = await restore();
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'error', isFinal: true,
      content: { message: 'Соединение потеряно' },
    }));
    expect(result.current.connectionError).toBe('Соединение потеряно');
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages).toHaveLength(0);
  });

  it('shows later workflow errors after an earlier reply settled the tracked turn', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse('request-1', { status: 'responded' }) });
    const { result } = await restore();
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, requestId: 'request-1', attempt: 1, type: 'error', isFinal: true,
      content: { message: 'Не удалось завершить генерацию' },
    }));
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe('Не удалось завершить генерацию');
    expect(result.current.isTyping).toBe(false);
  });

  it('restores pending after reload without sending the user message again', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse(),
      messages: [{ id: 'request-1', role: 'user', kind: 'text', content: 'Вопрос', options: null, createdAt: pendingResponse().updatedAt }] });
    const { result } = await restore();
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages.map((message) => message.content)).toEqual(['Вопрос']);
    expect(state.socket.emit).toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_CHAT, { conversationId: detail.id });
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('uses the optimistic UUID as requestId for text and option messages', async () => {
    const { result } = await restore();
    await act(async () => result.current.sendMessage('Первый вопрос'));
    const first = result.current.activeDialogue!.messages.at(-1)!;
    expect(state.socket.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: detail.id, requestId: first.id, kind: 'text', value: first.content,
    });
    expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.current.activeDialogue?.outgoingMessage).toMatchObject({ requestId: first.id, delivery: 'sending' });
    responseEvent(detail.id, pendingResponse(first.id, { status: 'responded' }));
    act(() => result.current.sendOptionMessage('option-1', 'Выбранный вариант'));
    expect(state.socket.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: detail.id, requestId: result.current.activeDialogue!.messages.at(-1)!.id,
      kind: 'option', value: 'option-1', label: 'Выбранный вариант',
    });
    expect(result.current.isTyping).toBe(true);
  });

  it('sends a server option once with its ID and label and restores the answered question without resending', async () => {
    const first = await restore();
    const options = [{ id: 'goal-accuracy', label: 'Улучшить точность' }];
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'question', id: 'question-accuracy', isFinal: false, turnComplete: true,
      content: { kind: 'question', label: 'Что нужно проверить?', options },
    }));
    expect(first.result.current.activeDialogue?.messages.at(-1)?.agentOptions).toEqual(options);
    act(() => {
      first.result.current.sendOptionMessage(options[0].id, options[0].label);
      first.result.current.sendOptionMessage(options[0].id, options[0].label);
    });
    const outgoing = first.result.current.activeDialogue!.outgoingMessage!;
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toEqual([
      [WS_CLIENT_EVENTS.SEND_MESSAGE, { conversationId: detail.id, requestId: outgoing.requestId,
        kind: 'option', value: 'goal-accuracy', label: 'Улучшить точность' }],
    ]);
    expect(first.result.current.activeDialogue?.messages.filter((message) => message.role === 'user')).toHaveLength(1);
    responseEvent(detail.id, pendingResponse(outgoing.requestId));
    act(() => first.result.current.sendOptionMessage('other', 'Другой вариант'));
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toHaveLength(1);
    first.unmount();
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse(outgoing.requestId), messages: [
      { id: 'question-accuracy', role: 'agent', kind: 'question', content: 'Что нужно проверить?', options,
        createdAt: '2026-10-29T09:00:00Z' },
      { id: outgoing.requestId, role: 'user', kind: 'option', content: outgoing.label!,
        options: null, createdAt: outgoing.timestamp },
    ] });
    const reloaded = await restore();
    expect(reloaded.result.current.activeDialogue?.messages).toMatchObject([
      { id: 'question-accuracy', agentOptions: options }, { id: outgoing.requestId, content: 'Улучшить точность' },
    ]);
    expect(reloaded.result.current.responsePending).toBe(true);
    expect(reloaded.result.current.activeDialogue?.outgoingMessage).toBeNull();
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toHaveLength(1);
  });

  it('keeps A pending across A → B → A and routes inactive replies without stopping B', async () => {
    const responseA = pendingResponse('request-a');
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: responseA });
    const { result } = await restore();
    act(() => result.current.startNewSession());
    act(() => state.handlers.get(WS_SERVER_EVENTS.CHAT_STARTED)?.({ conversationId: 'conversation-b' }));
    await act(async () => result.current.sendMessage('Вопрос B'));
    const responseB = pendingResponse(result.current.activeDialogue!.outgoingMessage!.requestId);
    responseEvent('conversation-b', responseB);
    expect(result.current.isTyping).toBe(true);
    await act(async () => result.current.selectDialogue(detail.id));
    await waitFor(() => expect(result.current.activeId).toBe(detail.id));
    expect(result.current.isTyping).toBe(true);
    expect(state.socket.emit.mock.calls.filter(([event, payload]) => event === WS_CLIENT_EVENTS.START_CHAT && payload.conversationId === detail.id)).toHaveLength(2);
    vi.mocked(getConversation).mockResolvedValue({ ...detail, id: 'conversation-b', responseState: responseB });
    await act(async () => result.current.selectDialogue('conversation-b'));
    await waitFor(() => expect(result.current.activeId).toBe('conversation-b'));
    responseEvent(detail.id, { ...responseA, status: 'responded', updatedAt: '2026-10-29T10:00:01Z' });
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, requestId: responseA.requestId, attempt: 1,
      type: 'message', id: 'answer-a', isFinal: false, content: { kind: 'text', label: 'Ответ A' },
    }));
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages.some((message) => message.content === 'Ответ A')).toBe(false);
    expect(result.current.dialogues.find((dialogue) => dialogue.id === detail.id)?.messages.at(-1)?.content).toBe('Ответ A');
    // A late restore acknowledgement must not select A over the user's B selection.
    act(() => state.handlers.get(WS_SERVER_EVENTS.CHAT_STARTED)?.({ conversationId: detail.id }));
    expect(result.current.activeId).toBe('conversation-b');
  });

  it('does not let an old REST snapshot replace a socket reply or reopen typing', async () => {
    let resolveDetail!: (value: ConversationDetailDto) => void;
    vi.mocked(getConversation).mockReturnValue(new Promise((resolve) => { resolveDetail = resolve; }));
    sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
    sessionStorage.setItem(CONV_OWNER_KEY, 'alice');
    const { result } = renderHook(() => useConversation(), { wrapper });
    responseEvent(detail.id, pendingResponse('request-1', { status: 'responded', updatedAt: '2026-10-29T10:00:01Z' }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, requestId: 'request-1', attempt: 1,
      type: 'message', id: 'persisted-answer', isFinal: false, content: { kind: 'text', label: 'Сохранённый ответ' },
    }));
    await act(async () => resolveDetail({ ...detail, responseState: pendingResponse() }));
    expect(result.current.activeDialogue?.responseState?.status).toBe('responded');
    expect(result.current.activeDialogue?.messages.filter((message) => message.id === 'persisted-answer')).toHaveLength(1);
    expect(result.current.isTyping).toBe(false);
  });

  it('restores a failed turn once and ignores duplicate error events', async () => {
    const failed = pendingResponse('request-failed', { status: 'failed', error: { code: 'agent_timeout', message: 'Ответ не получен вовремя', retryable: true } });
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: failed });
    const { result } = await restore();
    responseEvent(detail.id, failed);
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, requestId: failed.requestId, attempt: 1,
      type: 'error', isFinal: true, content: { message: failed.error!.message },
    }));
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activeDialogue?.messages.filter((message) => message.content === failed.error!.message)).toHaveLength(1);
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
  });

  it('keeps a newer attempt pending despite old states, old replies and generation completion', async () => {
    const current = pendingResponse('request-1', { attempt: 2 });
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: current, status: 'generating' });
    state.generation = { jobId: 'job-1', status: 'succeeded' };
    const { result } = await restore();
    responseEvent(detail.id, pendingResponse('request-1', { status: 'responded', updatedAt: '2026-10-29T11:00:00Z' }));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, requestId: 'request-1', attempt: 1,
      type: 'message', id: 'stale-answer', isFinal: false, content: { kind: 'text', label: 'Старый ответ' },
    }));
    expect(result.current.activeDialogue?.responseState).toEqual(current);
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages).toHaveLength(0);
    responseEvent(detail.id, { ...current, status: 'responded' });
    expect(result.current.isTyping).toBe(false);
  });

  it('retains transient legacy waiting until a meaningful reply arrives', async () => {
    const { result } = await restore();
    act(() => result.current.skipRecommendToCreate());
    expect(result.current.isTyping).toBe(true);
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({ type: 'message', id: 'empty', isFinal: false, content: { kind: 'text', label: '  ' } }));
    expect(result.current.isTyping).toBe(true);
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({ type: 'question', id: 'question', isFinal: true, content: { kind: 'question', label: 'Какая задача?', options: [] } }));
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activeDialogue?.messages.map((message) => message.content)).toEqual(['Какая задача?']);
  });

  it('keeps a blank generation result as job status without displaying an empty reply or settling the turn', async () => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse() });
    const { result } = await restore();
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'result', id: 'generation-start', isFinal: false,
      content: { kind: 'result', label: '', status: 'generating', generationJobId: 'job-1' },
    }));
    expect(result.current.activeDialogue?.conversationStatus).toBe('generating');
    expect(result.current.isTyping).toBe(true);
    expect(result.current.activeDialogue?.messages).toHaveLength(0);
  });

  it('refreshes owned detail for a blank deferred brief result without generating or completing the chat', async () => {
    const client = new QueryClient();
    setQueryClient(client);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(getConversation).mockResolvedValue({ ...detail, status: 'active' });
    const { result } = await restore();
    invalidate.mockClear();
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.({
      conversationId: detail.id, type: 'result', id: 'prepared-brief', isFinal: true,
      content: { kind: 'result', label: '', status: 'brief_ready' },
    }));
    await waitFor(() => expect(invalidate).toHaveBeenCalledExactlyOnceWith({
      queryKey: ['conversations', 'detail', 'alice', detail.id], exact: true,
    }));
    expect(result.current.activeDialogue?.conversationStatus).toBe('active');
    expect(result.current.activeDialogue?.messages).toHaveLength(0);
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBe('active');
    expect(result.current.generation).toBeUndefined();
    client.clear();
  });

  it.each(['', 'Brief готов'])('preserves a completed chat after a late brief_ready result with label "%s"', async (label) => {
    vi.mocked(getConversation).mockResolvedValue({ ...detail, status: 'completed' });
    const { result } = await restore();
    await waitFor(() => expect(result.current.activeDialogue?.conversationStatus).toBe('completed'));
    sessionStorage.setItem(CONV_STATUS_KEY, 'completed');
    const payload = { conversationId: detail.id, type: 'result', id: 'late-prepared-brief', isFinal: true,
      content: { kind: 'result', label, status: 'brief_ready' } };
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.(payload));
    act(() => state.handlers.get(WS_SERVER_EVENTS.AGENT_MESSAGE)?.(payload));
    expect(result.current.activeDialogue?.conversationStatus).toBe('completed');
    expect(sessionStorage.getItem(CONV_STATUS_KEY)).toBe('completed');
    expect(result.current.activeDialogue?.messages.filter(message => message.id === payload.id)).toHaveLength(label ? 1 : 0);
  });
});

describe('manual response retry and delivery recovery', () => {
  const failed = pendingResponse('fd8f893c-c6cc-44e2-83cb-9322095e69bf', {
    status: 'failed', error: { code: 'agent_timeout', message: 'Ответ не получен', retryable: true },
  });
  const failedDetail: ConversationDetailDto = { ...detail, responseState: failed, messages: [
    { id: failed.userMessageId, role: 'user', kind: 'text', content: 'Вопрос', options: null, createdAt: failed.updatedAt },
  ] };

  it('accepts the outgoing request acknowledgement even when two server states share a timestamp', async () => {
    vi.mocked(getConversation).mockResolvedValue(failedDetail);
    const { result } = await restore();
    await act(async () => result.current.sendMessage('Новый вопрос'));
    const next = result.current.activeDialogue!.outgoingMessage!;
    responseEvent(detail.id, pendingResponse(next.requestId, { updatedAt: failed.updatedAt }));
    expect(result.current.activeDialogue?.responseState?.requestId).toBe(next.requestId);
    expect(result.current.activeDialogue?.outgoingMessage).toBeNull();
    expect(result.current.isTyping).toBe(true);
  });

  it('retries the latest failed turn once without adding a user message, then restores retry after a new failure', async () => {
    vi.mocked(getConversation).mockResolvedValue(failedDetail);
    const { result } = await restore();
    expect(result.current.canRetryResponse).toBe(true);
    act(() => { result.current.retryResponse(); result.current.retryResponse(); });
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.RETRY_RESPONSE)).toEqual([
      [WS_CLIENT_EVENTS.RETRY_RESPONSE, { conversationId: detail.id, userMessageId: failed.userMessageId, expectedAttempt: 1 }],
    ]);
    expect(result.current.activeDialogue?.messages).toHaveLength(1);
    expect(result.current.isTyping).toBe(true);
    responseEvent(detail.id, { ...failed, status: 'pending', error: null, attempt: 2 });
    expect(result.current.isTyping).toBe(true);
    responseEvent(detail.id, { ...failed, attempt: 2, updatedAt: '2026-10-29T10:02:00Z' });
    expect(result.current.canRetryResponse).toBe(true);
    expect(result.current.activeDialogue?.messages.filter((message) => message.role === 'user')).toHaveLength(1);
    expect(result.current.activeDialogue?.messages.filter((message) => message.content === failed.error!.message)).toHaveLength(1);
  });

  it('unblocks an explicitly rejected retry and rejects obsolete or nonretryable turns', async () => {
    vi.mocked(getConversation).mockResolvedValue(failedDetail);
    const { result } = await restore();
    act(() => result.current.retryResponse());
    act(() => state.handlers.get(WS_SERVER_EVENTS.ERROR)?.({ message: 'Попробуйте позже' }));
    expect(result.current.canRetryResponse).toBe(true);
    expect(result.current.isTyping).toBe(false);
    responseEvent(detail.id, { ...failed, error: { ...failed.error!, retryable: false }, updatedAt: '2026-10-29T10:03:00Z' });
    expect(result.current.canRetryResponse).toBe(false);
    act(() => result.current.retryResponse());
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.RETRY_RESPONSE)).toHaveLength(1);
    await act(async () => result.current.sendMessage('Следующий вопрос'));
    const nextId = result.current.activeDialogue!.outgoingMessage!.requestId;
    responseEvent(detail.id, pendingResponse(nextId, { updatedAt: '2026-10-29T10:04:00Z' }));
    responseEvent(detail.id, { ...failed, updatedAt: '2026-10-29T10:05:00Z' });
    expect(result.current.canRetryResponse).toBe(false);
  });

  it('keeps an offline draft across reload, never buffers or auto-resends, and manually resends the same UUID', async () => {
    state.socket.connected = false;
    const first = await restore();
    await act(async () => first.result.current.sendMessage('Не потеряй этот текст'));
    const outgoing = first.result.current.activeDialogue!.outgoingMessage!;
    expect(outgoing.delivery).toBe('unconfirmed');
    expect(first.result.current.canRetryResponse).toBe(true);
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
    first.unmount();
    const second = await restore();
    expect(second.result.current.activeDialogue?.messages.map((message) => message.content)).toEqual(['Не потеряй этот текст']);
    expect(second.result.current.activeDialogue?.outgoingMessage?.requestId).toBe(outgoing.requestId);
    state.socket.connected = true;
    act(() => state.handlers.get('connect')?.(undefined));
    expect(state.socket.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toBe(false);
    act(() => second.result.current.retryResponse());
    expect(state.socket.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: detail.id, requestId: outgoing.requestId, kind: 'text', value: 'Не потеряй этот текст',
    });
    expect(second.result.current.activeDialogue?.messages).toHaveLength(1);
    responseEvent(detail.id, pendingResponse(outgoing.requestId));
    expect(second.result.current.activeDialogue?.outgoingMessage).toBeNull();
    expect(readOutgoingMessage('alice', detail.id)).toBeNull();
  });

  it('reconciles an accepted message from REST after an ACK was lost without duplicate bubbles', async () => {
    const first = await restore();
    await act(async () => first.result.current.sendMessage('Принятый вопрос'));
    const outgoing = first.result.current.activeDialogue!.outgoingMessage!;
    first.unmount();
    vi.mocked(getConversation).mockResolvedValue({ ...detail, responseState: pendingResponse(outgoing.requestId), messages: [
      { id: outgoing.requestId, role: 'user', kind: 'text', content: outgoing.value, options: null, createdAt: outgoing.timestamp },
    ] });
    const second = await restore();
    expect(second.result.current.activeDialogue?.messages).toHaveLength(1);
    expect(second.result.current.activeDialogue?.outgoingMessage).toBeNull();
    expect(second.result.current.isTyping).toBe(true);
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toHaveLength(1);
  });

  it('permits a manual retry after 10 seconds without ACK and never resets that deadline during polling', async () => {
    const { result } = await restore();
    vi.useFakeTimers();
    await act(async () => result.current.sendMessage('Не подтверждено'));
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(result.current.activeDialogue?.outgoingMessage?.delivery).toBe('unconfirmed');
    expect(result.current.canRetryResponse).toBe(true);
    expect(result.current.isTyping).toBe(false);
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toHaveLength(1);
  });

  it('allows another message after an immediate acknowledgement batched with the send', async () => {
    const { result } = await restore();
    state.socket.emit.mockImplementation((event, payload) => {
      if (event === WS_CLIENT_EVENTS.SEND_MESSAGE) {
        state.handlers.get(WS_SERVER_EVENTS.RESPONSE_STATE)?.({ conversationId: detail.id,
          responseState: pendingResponse(payload.requestId, { status: 'responded', updatedAt: new Date().toISOString() }) });
      }
    });
    await act(async () => result.current.sendMessage('Один'));
    await act(async () => result.current.sendMessage('Два'));
    expect(state.socket.emit.mock.calls.filter(([event]) => event === WS_CLIENT_EVENTS.SEND_MESSAGE)).toHaveLength(2);
    expect(result.current.activeDialogue?.messages.filter((message) => message.role === 'user')).toHaveLength(2);
    state.socket.emit.mockReset();
  });
});
