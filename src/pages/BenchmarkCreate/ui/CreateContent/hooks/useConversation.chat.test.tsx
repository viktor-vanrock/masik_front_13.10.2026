import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import type { ConversationDetailDto } from '@/api/conversations/types';
import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@/services/socket';
import { emittedStartChatIds, mapDetailToMessages } from '../utils/conversationUtils';
import { loadDerivedIntent, loadEntrySession, type DerivedIntent } from '../utils/derivedIntent';
import { clearAuthScopedStorage } from '@/services/auth';
import { useConversation } from './useConversation';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

const harness = vi.hoisted(() => ({
  listeners: new Map<string, (payload?: unknown) => void>(),
  emit: vi.fn(), getConversation: vi.fn(),
  authStatus: 'authenticated' as 'authenticated' | 'anonymous',
  userId: 'user-1' as string | null,
}));

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ t: translations.ru, status: harness.authStatus, user: harness.userId ? { id: harness.userId } : null }),
}));
vi.mock('@/services/socket', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/services/socket')>(),
  createChatSocket: () => ({
    on: (event: string, listener: (payload?: unknown) => void) => harness.listeners.set(event, listener),
    emit: harness.emit,
    connect: vi.fn(), disconnect: vi.fn(),
    removeAllListeners: () => harness.listeners.clear(),
  }),
}));
vi.mock('@/api/conversations', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/api/conversations')>(),
  useConversationsQuery: () => ({ data: [] }),
  getConversation: harness.getConversation,
}));
vi.mock('@/services/query', () => ({ getQueryClient: () => undefined }));
vi.mock('./useGeneration', () => ({ useGeneration: () => ({}) }));
vi.mock('./useProduction', () => ({ useProduction: () => ({}) }));

function receive(event: string, payload?: unknown) {
  act(() => { harness.listeners.get(event)?.(payload); });
}

function start() {
  const hook = renderHook(() => useConversation(), { wrapper });
  expect(harness.listeners.has(WS_SERVER_EVENTS.CHAT_STARTED)).toBe(true);
  act(() => hook.result.current.startNewSession());
  receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'conversation-1' });
  return hook;
}

beforeEach(() => {
  harness.emit.mockClear();
  harness.getConversation.mockReset();
  harness.listeners.clear();
  emittedStartChatIds.clear();
  harness.authStatus = 'authenticated';
  harness.userId = 'user-1';
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

const firstIntent: DerivedIntent = { mode: 'modify', baseId: 'base-a', baseType: 'test' };
const secondIntent: DerivedIntent = { mode: 'russify', baseId: 'base-b', baseType: 'suite' };
const entryOptions = { entryIntentKey: 'modify:test:base-a:visit-1', entryReady: true, entryTitle: 'Исходный тест', derivedIntent: firstIntent };
const newChatEmits = () => harness.emit.mock.calls.filter(([event, payload]) => event === WS_CLIENT_EVENTS.START_CHAT && !('conversationId' in (payload ?? {})));

describe('entry and derived chat startup', () => {
  it.each([
    { status: 'anonymous' as const, userId: 'user-1' },
    { status: 'authenticated' as const, userId: null },
  ])('does not create a chat without confirmed user: $status / $userId', ({ status, userId }) => {
    harness.authStatus = status;
    harness.userId = userId;
    const { result } = renderHook(() => useConversation(entryOptions), { wrapper });
    act(() => result.current.startNewSession());
    expect(newChatEmits()).toHaveLength(0);
    expect(result.current.activeId).toBeNull();
    expect(result.current.entryConversationId).toBeNull();
  });

  it('saves the intent captured when START_CHAT was sent, even if entry props change', () => {
    const { rerender } = renderHook(({ intent }) => useConversation({ ...entryOptions, derivedIntent: intent }), {
      wrapper, initialProps: { intent: firstIntent },
    });
    expect(harness.listeners.has(WS_SERVER_EVENTS.CHAT_STARTED)).toBe(true);
    expect(newChatEmits()).toHaveLength(1);
    rerender({ intent: secondIntent });
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'entry-chat' });
    expect(loadDerivedIntent('user-1', 'entry-chat')).toEqual(firstIntent);
    expect(loadEntrySession('user-1', entryOptions.entryIntentKey)).toBe('entry-chat');
  });

  it('restores the same entry conversation on a second visit and clears its key at logout', () => {
    const firstVisit = renderHook(() => useConversation(entryOptions), { wrapper });
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'entry-chat' });
    firstVisit.unmount();
    harness.emit.mockClear();
    const secondVisit = renderHook(() => useConversation(entryOptions), { wrapper });
    expect(newChatEmits()).toHaveLength(0);
    secondVisit.unmount();
    clearAuthScopedStorage();
    expect(loadEntrySession('user-1', entryOptions.entryIntentKey)).toBeNull();
    expect(loadDerivedIntent('user-1', 'entry-chat')).toBeNull();
  });

  it('keeps a manual New Chat free of derived intent and clears pending after chat_started', () => {
    const { result } = renderHook(() => useConversation(entryOptions), { wrapper });
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'entry-chat' });
    act(() => result.current.startNewSession());
    expect(newChatEmits()).toHaveLength(2);
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'manual-chat' });
    expect(loadDerivedIntent('user-1', 'manual-chat')).toBeNull();
    act(() => result.current.startNewSession());
    expect(newChatEmits()).toHaveLength(3);
  });

  it('queues a manual New Chat clicked while the entry chat is still pending', () => {
    const { result } = renderHook(() => useConversation(entryOptions), { wrapper });
    act(() => result.current.startNewSession());
    expect(newChatEmits()).toHaveLength(1);
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'entry-chat' });
    expect(newChatEmits()).toHaveLength(2);
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'manual-chat' });
    expect(loadDerivedIntent('user-1', 'entry-chat')).toEqual(firstIntent);
    expect(loadDerivedIntent('user-1', 'manual-chat')).toBeNull();
  });

  it('clears pending intent on socket error and allows a clean entry retry', () => {
    const { result } = renderHook(() => useConversation(entryOptions), { wrapper });
    receive(WS_SERVER_EVENTS.ERROR, { message: 'Connection failed' });
    act(() => result.current.retryEntrySession());
    expect(newChatEmits()).toHaveLength(2);
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'retry-chat' });
    expect(loadDerivedIntent('user-1', 'retry-chat')).toEqual(firstIntent);
  });

  it('does not retain pending state when sending START_CHAT throws', () => {
    harness.emit.mockImplementationOnce(() => { throw new Error('Socket unavailable'); });
    const { result } = renderHook(() => useConversation(entryOptions), { wrapper });
    expect(result.current.connectionError).toContain('Не удалось открыть чат');
    act(() => result.current.retryEntrySession());
    expect(newChatEmits()).toHaveLength(2);
    receive(WS_SERVER_EVENTS.CHAT_STARTED, { conversationId: 'after-failure' });
    expect(loadDerivedIntent('user-1', 'after-failure')).toEqual(firstIntent);
  });
});

describe('unified interviewer chat', () => {
  it('sends an initial greeting to the agent without requesting search', async () => {
    const { result } = start();
    await act(async () => { await result.current.sendMessage('Привет!'); });
    expect(harness.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: 'conversation-1', kind: 'text', value: 'Привет!',
    });
    expect(harness.emit.mock.calls.some(([event]) => event === WS_CLIENT_EVENTS.REQUEST_RECOMMENDATIONS)).toBe(false);
    receive(WS_SERVER_EVENTS.AGENT_MESSAGE, {
      type: 'message', id: 'greeting-1', isFinal: false,
      content: { kind: 'text', label: 'Привет! Могу найти бенчмарк или помочь создать свой.' },
    });
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toContain('Могу найти');
    expect(result.current.isTyping).toBe(false);
  });

  it('keeps search cards conversational and sends an unrelated follow-up to the same agent', async () => {
    const { result } = start();
    receive(WS_SERVER_EVENTS.RECOMMENDATION_RESULT, {
      status: 'completed', requestId: 'search-message', conversationId: 'conversation-1',
      retrievalVersion: 'interviewer-tool-v1', label: 'Нашёл подходящий бенчмарк.',
      recommendations: [{ id: 'rec-1', testId: 'benchmark-1', status: 'pending' }],
      explanations: [{ testId: 'benchmark-1', explanation: 'Найдено по текстовому совпадению в каталоге.' }],
    });
    expect(result.current.activeDialogue?.conversationStatus).toBe('active');
    expect(result.current.activeDialogue?.messages.at(-1)).toMatchObject({
      id: 'recommendation-result-search-message', content: 'Нашёл подходящий бенчмарк.',
      recommendations: ['benchmark-1'],
    });
    await act(async () => { await result.current.sendMessage('А как измеряют точность?'); });
    expect(harness.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: 'conversation-1', kind: 'text', value: 'А как измеряют точность?',
    });
  });

  it.each([
    { name: 'three identical descriptions', explanations: ['Совпадение в каталоге.', 'Совпадение в каталоге.', 'Совпадение в каталоге.'],
      expected: 'Совпадение в каталоге.' },
    { name: 'trimmed duplicates and blanks', explanations: ['  Совпадение в каталоге. ', ' \n ', 'Совпадение в каталоге.'],
      expected: 'Совпадение в каталоге.' },
    { name: 'distinct descriptions', explanations: ['Проверяет код.', 'Проверяет текст.', 'Проверяет факты.'],
      expected: 'Проверяет код.\n\nПроверяет текст.\n\nПроверяет факты.' },
    { name: 'missing descriptions', explanations: [undefined, '', ' \n '],
      expected: translations.ru.create.recommendResult },
  ])('keeps live and restored search text consistent for $name', ({ explanations, expected }) => {
    const { result } = start();
    const now = '2026-10-06T00:00:00.000Z';
    const recommendations = explanations.map((_, index) => ({
      id: `rec-${index}`, conversationId: 'conversation-1', testId: `benchmark-${index}`,
      status: 'pending' as const, createdAt: now, updatedAt: now,
    }));
    receive(WS_SERVER_EVENTS.RECOMMENDATION_RESULT, {
      status: 'completed', requestId: 'search-1', conversationId: 'conversation-1',
      retrievalVersion: 'postgres-substring-v1', recommendations,
      explanations: [
        ...recommendations.map((item, index) => ({ testId: item.testId, explanation: explanations[index] })),
        { testId: 'not-in-search-results', explanation: 'Это не должно отображаться.' },
      ],
    });
    const detail: ConversationDetailDto = {
      id: 'conversation-1', status: 'active', createdAt: now, updatedAt: now,
      messages: [], recommendations,
      recommendationRequests: [{
        id: 'search-1', conversationId: 'conversation-1', query: 'Найди бенчмарк',
        topK: 3, status: 'completed', attemptCount: 1, maxAttempts: 1,
        nextRetryAt: null, retrievalVersion: 'postgres-substring-v1',
        rerankerVersion: null, retrievalDurationMs: 10,
        resultPayload: recommendations.map((item, index) => ({
          testId: item.testId, rank: index + 1, score: 1 - index * 0.1,
          explanation: explanations[index], sourceUpdatedAt: now,
        })),
        errorCode: null, errorMessage: null, retryable: null,
        completedAt: now, createdAt: now, updatedAt: now,
      }],
    };
    const restoredMessage = mapDetailToMessages(detail, {
      recommendationResult: translations.ru.create.recommendResult,
      recommendationEmpty: translations.ru.create.recommendEmpty,
      recommendationFailed: translations.ru.create.recommendFailed,
      recommendationRetrying: translations.ru.create.recommendRetrying,
      recommendationSelected: translations.ru.create.recommendYes,
      recommendationRejected: translations.ru.create.recommendNo,
    }).find((message) => message.role === 'assistant');
    const liveMessage = result.current.activeDialogue?.messages.at(-1);
    expect(liveMessage?.content).toBe(expected);
    expect(restoredMessage?.content).toBe(expected);
    expect(liveMessage?.recommendations).toHaveLength(3);
    expect(restoredMessage?.recommendations).toEqual(liveMessage?.recommendations);
  });

  it('keeps chat active after a card rejection and records its action', () => {
    const { result } = start();
    act(() => result.current.rejectRecommendation('rec-1'));
    expect(harness.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.REJECT_RECOMMENDATION, { recommendationId: 'rec-1' });
    receive(WS_SERVER_EVENTS.RECOMMENDATION_UPDATED, {
      id: 'rec-1', conversationId: 'conversation-1', testId: 'benchmark-1',
      status: 'rejected', createdAt: '2026-10-06T00:00:00Z', updatedAt: '2026-10-06T00:00:01Z',
    });
    expect(result.current.activeDialogue?.conversationStatus).toBe('active');
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe(translations.ru.create.recommendNo);
  });

  it('does not poll search history or erase a pending ordinary turn', async () => {
    vi.useFakeTimers();
    const { result } = start();
    await act(async () => { await result.current.sendMessage('Расскажи про бенчмарки'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(6_000); });
    expect(harness.getConversation).not.toHaveBeenCalled();
    expect(result.current.activeDialogue?.messages.at(-1)?.content).toBe('Расскажи про бенчмарки');
    expect(result.current.isTyping).toBe(true);
  });

  it('rejoins the active conversation after a transport reconnect', () => {
    start();
    receive('connect');
    harness.emit.mockClear();
    receive('disconnect');
    receive('connect');
    expect(harness.emit).toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_CHAT, { conversationId: 'conversation-1' });
  });

  it('shows generation separately and answers free-form chat while the job runs', async () => {
    const { result } = start();
    receive(WS_SERVER_EVENTS.AGENT_MESSAGE, {
      type: 'result', id: 'brief-1', isFinal: false,
      content: { kind: 'result', label: 'ТЗ готово, начинаю генерацию.', status: 'generating', generationJobId: 'job-1' },
    });
    expect(result.current.activeDialogue).toMatchObject({
      conversationStatus: 'generating', status: 'in-progress', phase: 'create',
    });
    await act(async () => { await result.current.sendMessage('Объясни, что такое accuracy'); });
    expect(harness.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: 'conversation-1', kind: 'text', value: 'Объясни, что такое accuracy',
    });
    expect(result.current.isTyping).toBe(true);
    receive(WS_SERVER_EVENTS.AGENT_MESSAGE, {
      type: 'message', id: 'accuracy-1', isFinal: false,
      content: { kind: 'text', label: 'Accuracy — доля правильных ответов.' },
    });
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activeDialogue?.conversationStatus).toBe('generating');
  });

  it('resumes the agent and sends follow-up chat after generation completed', async () => {
    const { result } = start();
    receive(WS_SERVER_EVENTS.AGENT_MESSAGE, {
      type: 'result', id: 'generated-1', isFinal: true,
      content: { kind: 'result', label: 'Задания созданы.', status: 'done' },
    });
    expect(result.current.activeDialogue?.conversationStatus).toBe('completed');
    harness.emit.mockClear();
    receive('disconnect');
    receive('connect');
    expect(harness.emit).toHaveBeenCalledWith(WS_CLIENT_EVENTS.START_CHAT, { conversationId: 'conversation-1' });
    await act(async () => { await result.current.sendMessage('Как использовать задания?'); });
    expect(harness.emit).toHaveBeenLastCalledWith(WS_CLIENT_EVENTS.SEND_MESSAGE, {
      conversationId: 'conversation-1', kind: 'text', value: 'Как использовать задания?',
    });
    expect(result.current.isTyping).toBe(true);
    receive(WS_SERVER_EVENTS.AGENT_MESSAGE, {
      type: 'message', id: 'instructions-1', isFinal: false,
      content: { kind: 'text', label: 'Передайте задания оцениваемой модели.' },
    });
    expect(result.current.isTyping).toBe(false);
  });
});
