import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { getConversation } from '@/api/conversations';
import type { ConversationDetailDto } from '@/api/conversations';
import { CONV_SESSION_KEY, CONV_OWNER_KEY, CONV_STATUS_KEY } from '@/services/auth';
import { ApiException } from '@/services/http';
import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@/services/socket';
import { useConversation } from './useConversation';

const state = vi.hoisted(() => ({
  userId: 'alice',
  handlers: new Map<string, (payload: unknown) => void>(),
  socket: {
    on: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), removeAllListeners: vi.fn(), emit: vi.fn(),
  },
  generation: undefined as { jobId: string; status: string } | undefined,
}));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru, status: 'authenticated', user: { id: state.userId } }) }));
vi.mock('@/api/conversations', async (original) => ({
  ...await original<typeof import('@/api/conversations')>(),
  useSidebarConversationsQuery: () => ({ data: { pages: [{ pinned: [], data: [{ id: 'conversation', status: 'awaiting_choice', createdAt: '', updatedAt: '' }], total: 1, archived: [] }] }, fetchNextPage: vi.fn(), hasNextPage: false, isFetchingNextPage: false }),
  getConversation: vi.fn(),
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
  state.userId = 'alice';
  state.handlers.clear();
  state.generation = undefined;
  state.socket.on.mockImplementation((event, handler) => { state.handlers.set(event, handler); });
  vi.mocked(getConversation).mockResolvedValue(detail);
});

async function restore() {
  sessionStorage.setItem(CONV_SESSION_KEY, detail.id);
  sessionStorage.setItem(CONV_OWNER_KEY, 'alice');
  const hook = renderHook(() => useConversation(), { wrapper });
  await waitFor(() => expect(hook.result.current.activeId).toBe(detail.id));
  return hook;
}

describe('useConversation integrated contracts', () => {
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
