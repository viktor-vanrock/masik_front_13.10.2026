import { describe, expect, it } from 'vitest';

import type { ConversationDetailDto } from '@/api/conversations/types';

import {
  agentPayloadCompletesConversation,
  type ConversationHistoryLabels,
  mapAgentPayloadToMessage,
  dtoToDialogue,
  formatRecommendationExplanations,
  mapDetailToMessages,
  mapRecommendationUpdateToActionMessage,
  mergeConversationMessages,
} from './conversationUtils';

const labels: ConversationHistoryLabels = {
  recommendationResult: 'Результат',
  recommendationEmpty: 'Ничего не найдено',
  recommendationFailed: 'Ошибка',
  recommendationRetrying: 'Повторяем',
  recommendationSelected: 'Да',
  recommendationRejected: 'Нет',
};

const baseConversation: ConversationDetailDto = {
  id: '11111111-1111-4111-8111-111111111111',
  status: 'active',
  createdAt: '2026-08-17T09:00:00.000Z',
  updatedAt: '2026-08-17T09:00:02.000Z',
  messages: [],
  recommendations: [],
  recommendationRequests: [],
};

describe('recommendation explanations', () => {
  it('shows the common search explanation once for three different benchmarks', () => {
    const explanation = 'Найдено по текстовому совпадению в каталоге.';
    expect(formatRecommendationExplanations([explanation, explanation, explanation]))
      .toBe(explanation);
  });

  it('ignores missing and blank explanations and treats trimmed copies as duplicates', () => {
    expect(formatRecommendationExplanations([
      undefined, null, '', ' \n ', 'Проверяет понимание диалога.',
      '  Проверяет понимание диалога. \n',
    ])).toBe('Проверяет понимание диалога.');
    expect(formatRecommendationExplanations([undefined, null, '', ' \n '])).toBeUndefined();
  });

  it('preserves distinct explanations in their original order', () => {
    expect(formatRecommendationExplanations([
      'Проверяет код.', 'Проверяет текст.', ' Проверяет код. ',
      'Проверяет факты.', 'Проверяет текст.',
    ])).toBe('Проверяет код.\n\nПроверяет текст.\n\nПроверяет факты.');
  });
});

describe('mapDetailToMessages', () => {
  it('preserves legacy finished results even when the agent does not set isFinal', () => {
    expect(agentPayloadCompletesConversation({
      type: 'result', id: 'legacy-result', isFinal: false,
      content: { kind: 'result', status: 'finished', label: 'Complete' },
    })).toBe(true);
  });
  it('restores three cards with their shared text-match explanation shown only once', () => {
    const explanation = 'Найдено по текстовому совпадению в каталоге.';
    const ids = ['benchmark-a', 'benchmark-b', 'benchmark-c'];
    const history = mapDetailToMessages({
      ...baseConversation,
      recommendations: ids.map((testId) => ({
        id: `rec-${testId}`, conversationId: baseConversation.id, testId,
        status: 'pending', createdAt: baseConversation.createdAt, updatedAt: baseConversation.updatedAt,
      })),
      recommendationRequests: [{
        id: 'search-1', conversationId: baseConversation.id, query: 'Найди бенчмарк',
        topK: 3, status: 'completed', attemptCount: 1, maxAttempts: 1,
        nextRetryAt: null, retrievalVersion: 'postgres-substring-v1',
        rerankerVersion: null, retrievalDurationMs: 10,
        resultPayload: ids.map((testId, index) => ({
          testId, rank: index + 1, score: 1 - index * 0.1, explanation,
          sourceUpdatedAt: baseConversation.createdAt,
        })),
        errorCode: null, errorMessage: null, retryable: null,
        completedAt: baseConversation.updatedAt, createdAt: baseConversation.createdAt,
        updatedAt: baseConversation.updatedAt,
      }],
    }, labels);
    const resultMessage = history.find((message) => message.role === 'assistant');
    expect(resultMessage).toMatchObject({ content: explanation, recommendations: ids });
    expect(resultMessage?.recommendationItems).toHaveLength(3);
  });
  it('preserves ordinary conversational responses before and after reload', () => {
    const payload = {
      type: 'message' as const, id: 'reply-id', isFinal: false as const,
      content: { kind: 'text' as const, label: 'Могу найти готовый бенчмарк или помочь создать свой.' },
    };
    expect(agentPayloadCompletesConversation(payload)).toBe(false);
    const liveMessage = mapAgentPayloadToMessage(payload);
    const history = mapDetailToMessages({
      ...baseConversation,
      messages: [{ id: payload.id, role: 'agent', kind: 'text', content: payload.content.label,
        options: null, createdAt: baseConversation.createdAt }],
    }, labels);
    expect(liveMessage).toMatchObject({ id: 'reply-id', content: payload.content.label });
    expect(history[0]).toMatchObject({ id: 'reply-id', content: payload.content.label });
  });

  it('restores interviewer search cards with stable delivery IDs without a recommendation request', () => {
    const history = mapDetailToMessages({
      ...baseConversation,
      messages: [{ id: 'tool-search-id', role: 'agent', kind: 'text', content: 'Подойдут эти два бенчмарка.',
        options: { kind: 'recommendations', benchmarks: [{ testId: 'benchmark-b' }, { testId: 'benchmark-a' }] },
        createdAt: baseConversation.createdAt }],
      recommendations: ['benchmark-a', 'benchmark-b'].map((testId) => ({
        id: `rec-${testId}`, conversationId: baseConversation.id, testId,
        status: 'pending' as const, createdAt: baseConversation.createdAt, updatedAt: baseConversation.updatedAt,
      })),
    }, labels);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      id: 'recommendation-result-tool-search-id', content: 'Подойдут эти два бенчмарка.',
      recommendations: ['benchmark-b', 'benchmark-a'],
      recommendationItems: [
        { testId: 'benchmark-b', id: 'rec-benchmark-b', status: 'pending' },
        { testId: 'benchmark-a', id: 'rec-benchmark-a', status: 'pending' },
      ],
    });
    expect(mergeConversationMessages(history, history)).toHaveLength(1);
  });

  it('keeps the same reply when it belongs to separate turns', () => {
    const messages = mapDetailToMessages({
      ...baseConversation,
      messages: ['reply-1', 'reply-2'].map((id) => ({ id, role: 'agent', kind: 'text',
        content: 'Какую область проверяем?', options: null, createdAt: baseConversation.createdAt })),
    }, labels);
    expect(messages).toHaveLength(2);
  });
  it('does not finish the interview on a model or handoff error', () => {
    expect(agentPayloadCompletesConversation({
      type: 'error', isFinal: true, content: { message: 'Попробуйте ещё раз' },
    })).toBe(false);
  });
  it('keeps a completed brief open while Inventor runs, including after reload', () => {
    const payload = {
      type: 'result' as const,
      id: 'brief-id',
      isFinal: false,
      content: {
        kind: 'result' as const,
        label: 'ТЗ: вопросы о налогах, четыре варианта.',
        status: 'generating' as const,
        generationJobId: 'job-id',
      },
    };
    expect(agentPayloadCompletesConversation(payload)).toBe(false);
    expect(mapAgentPayloadToMessage(payload).content).toBe(payload.content.label);
    expect(dtoToDialogue({ ...baseConversation, intent: 'create_new', status: 'generating' }))
      .toMatchObject({ status: 'in-progress', phase: 'create', conversationStatus: 'generating' });
  });

  it('restores a pending query from REST', () => {
    const messages = mapDetailToMessages(
      {
        ...baseConversation,
        recommendationRequests: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            conversationId: baseConversation.id,
            query: 'Нужен диалоговый бенчмарк',
            topK: 1,
            status: 'pending',
            attemptCount: 1,
            maxAttempts: 1,
            nextRetryAt: null,
            retrievalVersion: null,
            rerankerVersion: null,
            retrievalDurationMs: null,
            resultPayload: null,
            errorCode: null,
            errorMessage: null,
            retryable: null,
            completedAt: null,
            createdAt: '2026-08-17T09:00:01.000Z',
            updatedAt: '2026-08-17T09:00:02.000Z',
          },
        ],
      },
      labels,
    );

    expect(messages.map((message) => message.content)).toEqual([
      'Нужен диалоговый бенчмарк',
    ]);
  });

  it('restores a completed recommendation card', () => {
    const testId =
      '33333333-3333-4333-8333-333333333333';
    const recommendationId =
      '44444444-4444-4444-8444-444444444444';

    const messages = mapDetailToMessages(
      {
        ...baseConversation,
        status: 'awaiting_choice',
        recommendations: [
          {
            id: recommendationId,
            conversationId: baseConversation.id,
            testId,
            status: 'pending',
            createdAt: '2026-08-17T09:00:03.000Z',
            updatedAt: '2026-08-17T09:00:03.000Z',
          },
        ],
        recommendationRequests: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            conversationId: baseConversation.id,
            query: 'Нужен диалоговый бенчмарк',
            topK: 1,
            status: 'completed',
            attemptCount: 1,
            maxAttempts: 1,
            nextRetryAt: null,
            retrievalVersion: 'pgvector:test-embedding-v1',
            rerankerVersion: 'Qwen/Qwen3-Reranker-8B',
            retrievalDurationMs: 24,
            resultPayload: [
              {
                testId,
                rank: 1,
                score: 0.9,
                rerankScore: 0.95,
                explanation: 'Проверяет понимание диалога.',
                sourceUpdatedAt: '2026-08-17T08:00:00.000Z',
              },
            ],
            errorCode: null,
            errorMessage: null,
            retryable: null,
            completedAt: '2026-08-17T09:00:03.000Z',
            createdAt: '2026-08-17T09:00:01.000Z',
            updatedAt: '2026-08-17T09:00:03.000Z',
          },
        ],
      },
      labels,
    );

    expect(messages[1]).toMatchObject({
      content: 'Проверяет понимание диалога.',
      recommendations: [testId],
      pendingRecommendationId: recommendationId,
      recommendationStatus: 'pending',
    });
  });

  it('restores multiple recommendations with separate actions in search order', () => {
    const ids = ['benchmark-a', 'benchmark-b'];
    const recommendations = ids.map((testId, index) => ({
      id: `recommendation-${index}`,
      conversationId: baseConversation.id,
      testId,
      status: index === 0 ? 'rejected' as const : 'pending' as const,
      createdAt: '2026-08-17T09:00:03.000Z',
      updatedAt: '2026-08-17T09:00:03.000Z',
    }));
    const messages = mapDetailToMessages({
      ...baseConversation,
      status: 'awaiting_choice',
      recommendations: [...recommendations].reverse(),
      recommendationRequests: [{
        id: 'request-1', conversationId: baseConversation.id, query: 'Нужен бенчмарк',
        topK: 3, status: 'completed', attemptCount: 1, maxAttempts: 1,
        nextRetryAt: null, retrievalVersion: 'postgres-substring-v1',
        rerankerVersion: null, retrievalDurationMs: 10,
        resultPayload: ids.map((testId, index) => ({
          testId, rank: index + 1, score: 1 - index * 0.1,
          sourceUpdatedAt: '2026-08-17T08:00:00.000Z',
        })),
        errorCode: null, errorMessage: null, retryable: null,
        completedAt: '2026-08-17T09:00:03.000Z',
        createdAt: '2026-08-17T09:00:01.000Z',
        updatedAt: '2026-08-17T09:00:03.000Z',
      }],
    }, labels);

    expect(messages[1]).toMatchObject({
      recommendations: ids,
      recommendationItems: [
        { testId: 'benchmark-a', id: 'recommendation-0', status: 'rejected' },
        { testId: 'benchmark-b', id: 'recommendation-1', status: 'pending' },
      ],
    });
  });

  it('renders an Interviewer result consistently before and after reload', () => {
    const resultId = '55555555-5555-4555-8555-555555555555';
    const resultText = 'Черновик нового бенчмарка сформирован (mock)';
    const payload = {
      type: 'result' as const,
      isFinal: true,
      id: resultId,
      content: {
        kind: 'result' as const,
        label: resultText,
        status: 'done' as const,
      },
    };

    const liveMessage = mapAgentPayloadToMessage(payload);
    const restoredMessages = mapDetailToMessages(
      {
        ...baseConversation,
        intent: 'create_new',
        status: 'completed',
        messages: [
          {
            id: resultId,
            role: 'agent',
            kind: 'result',
            content: resultText,
            options: null,
            createdAt: '2026-08-17T09:00:03.000Z',
          },
        ],
      },
      labels,
    );

    expect(agentPayloadCompletesConversation(payload)).toBe(true);
    expect(liveMessage).toMatchObject({
      id: resultId,
      content: resultText,
    });
    expect(liveMessage).not.toHaveProperty('recommendations');
    expect(restoredMessages[0]).toMatchObject({
      id: resultId,
      content: resultText,
    });
    expect(restoredMessages[0]).not.toHaveProperty('recommendations');
  });

  it('restores the mock draft marker from persisted result metadata', () => {
    const payload = {
      type: 'result' as const,
      isFinal: true,
      id: '55555555-5555-4555-8555-555555555555',
      content: { kind: 'result' as const, label: 'Черновик нового бенчмарка сформирован (mock)',
        status: 'done' as const, resultKey: 'mock_draft_ready' as const },
    };
    expect(mapAgentPayloadToMessage(payload).resultKey).toBe('mock_draft_ready');
    const restored = mapDetailToMessages({
      ...baseConversation,
      intent: 'create_new',
      messages: [{ id: payload.id, role: 'agent', kind: 'result', content: payload.content.label,
        options: { resultKey: 'mock_draft_ready', status: 'done' }, createdAt: '2026-08-17T09:00:03.000Z' }],
    }, labels);
    expect(restored[0].resultKey).toBe('mock_draft_ready');
  });
});

describe('live recommendation actions', () => {
  it('preserves repeated user text in separate conversation turns during REST recovery', () => {
    const merged = mergeConversationMessages([
      { id: 'optimistic-user', role: 'user', content: 'Да', timestamp: '2026-08-17T09:00:04.000Z' },
    ], [
      { id: 'persisted-user', role: 'user', content: 'Да', timestamp: '2026-08-17T09:00:04.100Z' },
      { id: 'second-turn', role: 'user', content: 'Да', timestamp: '2026-08-17T09:00:05.000Z' },
    ]);
    expect(merged.map((message) => message.id)).toEqual(['optimistic-user', 'second-turn']);
  });
  it('maps a confirmed rejection to an immediate stable user message', () => {
    const message = mapRecommendationUpdateToActionMessage(
      {
        id: '66666666-6666-4666-8666-666666666666',
        conversationId: baseConversation.id,
        testId: '77777777-7777-4777-8777-777777777777',
        status: 'rejected',
        createdAt: '2026-08-17T09:00:03.000Z',
        updatedAt: '2026-08-17T09:00:04.000Z',
      },
      labels,
    );

    expect(message).toEqual({
      id: 'recommendation-action-66666666-6666-4666-8666-666666666666',
      role: 'user',
      content: 'Нет',
      timestamp: '2026-08-17T09:00:04.000Z',
    });
  });

  it('places a delayed REST action before a newer interviewer question', () => {
    const merged = mergeConversationMessages(
      [
        {
          id: 'agent-question',
          role: 'assistant',
          content: 'Какой домен вас интересует?',
          timestamp: '2026-08-17T09:00:05.000Z',
        },
      ],
      [
        {
          id: 'persisted-rejection',
          role: 'user',
          content: 'Нет',
          timestamp: '2026-08-17T09:00:04.000Z',
        },
      ],
    );

    expect(merged.map((message) => message.id)).toEqual([
      'persisted-rejection',
      'agent-question',
    ]);
  });

  it('does not duplicate an optimistic action during REST recovery', () => {
    const merged = mergeConversationMessages(
      [
        {
          id: 'recommendation-action-id',
          role: 'user',
          content: 'Нет',
          timestamp: '2026-08-17T09:00:04.000Z',
        },
      ],
      [
        {
          id: 'persisted-rejection',
          role: 'user',
          content: 'Нет',
          timestamp: '2026-08-17T09:00:04.100Z',
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe('recommendation-action-id');
  });
});
