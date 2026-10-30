import type { ChatMessage, Dialogue } from '@/types';
import { DialogueStatus, DialoguePhase } from '@/types';
import type { ConversationDetailDto, ConversationDto } from '@/api/conversations/types';
import { CONV_NAMES_KEY } from '@/services/auth';
import type {
  AgentMessagePayload,
  RecommendationUpdatedPayload,
} from '@/services/socket';
import { createAssistantMessage } from './messageFactory';

// Module-level set prevents duplicate start_chat {conversationId} emissions
// when React StrictMode mounts the component twice and both sockets connect
// before the first cleanup runs (race condition on fast localhost connections).
export const emittedStartChatIds = new Set<string>();

function getConvNames(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CONV_NAMES_KEY) ?? '{}'); } catch { return {}; }
}

export function saveConvName(id: string, name: string, nameEn: string): void {
  const names = getConvNames();
  names[id] = JSON.stringify({ ru: name, en: nameEn });
  localStorage.setItem(CONV_NAMES_KEY, JSON.stringify(names));
}

export function loadConvName(id: string): { ru: string; en: string } {
  try {
    const raw = getConvNames()[id];
    return raw ? JSON.parse(raw) : { ru: 'Чат', en: 'Chat' };
  } catch { return { ru: 'Чат', en: 'Chat' }; }
}

export function dtoToDialogue(conv: ConversationDto): Dialogue {
  const { id } = conv;
  const name = loadConvName(id);
  const title = conv.title ?? name.ru;
  return {
    id,
    conversationId: id,
    conversationStatus: conv.status,
    catalogSubmissionStatus: null,
    benchmarkName: title,
    benchmarkNameEn: conv.title ?? name.en,
    isArchived: conv.isArchived ?? false,
    pinnedDate: conv.pinnedDate ?? null,
    startedAt: conv.createdAt,
    updatedAt: conv.updatedAt ?? conv.createdAt,
    status:
      conv.status === 'completed' || conv.status === 'abandoned'
        ? DialogueStatus.Done
        : DialogueStatus.InProgress,
    phase:
      conv.intent === 'create_new'
        ? DialoguePhase.Create
        : DialoguePhase.Recommend,
    messages: [],
  };
}

export interface ConversationHistoryLabels {
  recommendationResult: string;
  recommendationEmpty: string;
  recommendationFailed: string;
  recommendationRetrying: string;
  recommendationSelected: string;
  recommendationRejected: string;
}

/** Shared explanations appear once even when several cards use the same text. */
export function formatRecommendationExplanations(
  explanations: readonly (string | null | undefined)[] | undefined,
): string | undefined {
  const unique = new Set(
    explanations
      ?.map((explanation) => explanation?.trim())
      .filter((explanation): explanation is string => Boolean(explanation)),
  );
  return [...unique].join('\n\n') || undefined;
}

/**
 * recommendation_updated является подтверждением сервера, что действие
 * пользователя сохранено. Показываем его сразу, не дожидаясь REST recovery:
 * иначе первый вопрос Interviewer может визуально обогнать сообщение пользователя.
 */
export function mapRecommendationUpdateToActionMessage(
  payload: RecommendationUpdatedPayload,
  labels: ConversationHistoryLabels,
): ChatMessage | null {
  if (payload.status === 'pending') return null;

  return {
    id: `recommendation-action-${payload.id}`,
    role: 'user',
    content:
      payload.status === 'selected'
        ? labels.recommendationSelected
        : labels.recommendationRejected,
    timestamp: payload.updatedAt,
  };
}

/**
 * Socket-сообщения могут прийти раньше, чем отложенный REST recovery увидит
 * предшествующее сохранённое сообщение. После объединения восстанавливаем
 * хронологический порядок, вместо простого добавления REST-истории в конец.
 */
export function mergeConversationMessages(
  current: ChatMessage[],
  fresh: ChatMessage[],
): ChatMessage[] {
  const merged = [...current];
  const existingIds = new Set(current.map((message) => message.id));
  const matchedUserIds = new Set<string>();

  for (const message of fresh) {
    if (existingIds.has(message.id)) {
      if (message.role === 'user') matchedUserIds.add(message.id);
      continue;
    }
    if (message.role === 'user') {
      // Pair each persisted user message with one recent optimistic copy.
      // The same text in a later turn still belongs in conversational history.
      const optimisticCopy = current.find((candidate) =>
        candidate.role === 'user' && candidate.content === message.content
        && !matchedUserIds.has(candidate.id)
        && Math.abs(new Date(candidate.timestamp).getTime()
          - new Date(message.timestamp).getTime()) <= 2_000,
      );
      if (optimisticCopy) {
        matchedUserIds.add(optimisticCopy.id);
        continue;
      }
    }

    merged.push(message);
    existingIds.add(message.id);
  }

  return merged.sort(
    (left, right) =>
      new Date(left.timestamp).getTime() -
      new Date(right.timestamp).getTime(),
  );
}

export function mapAgentPayloadToMessage(
  payload: AgentMessagePayload,
): ChatMessage {
  if (payload.type === 'message') {
    return createAssistantMessage(payload.content.label, {}, payload.id);
  }

  if (payload.type === 'question') {
    return createAssistantMessage(
      payload.content.label,
      { agentOptions: payload.content.options ?? undefined },
      payload.id,
    );
  }

  if (payload.type === 'result') {
    return createAssistantMessage(payload.content.label, { resultKey: payload.content.resultKey }, payload.id);
  }

  if (payload.type === 'hypotheses') {
    return createAssistantMessage(
      `Гипотезы (${payload.content.testId}): ${payload.content.hypotheses.join(', ')}`,
      {},
      payload.id,
    );
  }

  return createAssistantMessage(payload.content.message);
}

export function agentPayloadCompletesConversation(
  payload: AgentMessagePayload,
): boolean {
  // isFinal marks the end of this agent response. A question still expects
  // the user's answer and must keep the conversation active.
  if (payload.type === 'error' || payload.type === 'message' || payload.type === 'question') return false;
  if (payload.type === 'result' && payload.content.status === 'generating') return false;
  return payload.type === 'result' || payload.isFinal;
}

/**
 * Собирает отображаемую историю из трёх устойчивых источников:
 * обычных Message, RecommendationRequest и Recommendation.
 *
 * Socket.IO отвечает за мгновенное обновление, а эта функция —
 * за восстановление того же состояния после навигации или reconnect.
 */
export function mapDetailToMessages(
  detail: ConversationDetailDto,
  labels: ConversationHistoryLabels,
): ChatMessage[] {
  // Stable IDs distinguish repeated conversational replies from duplicate delivery.
  const seenMessageIds = new Set<string>();
  const persistedMessages = detail.messages
    .filter((m) => {
      if (!m.id) return true;
      if (seenMessageIds.has(m.id)) return false;
      seenMessageIds.add(m.id);
      return true;
    })
    .map((m, idx) => {
      const role: 'user' | 'assistant' = m.role === 'agent' ? 'assistant' : 'user';
      const id = m.id || `rest-${role}-${m.kind}-${m.createdAt}-${idx}`;
      let content = m.content;

      // В БД action хранит стабильный testId, но пользователю
      // показываем понятную локализованную формулировку.
      if (m.kind === 'recommendation_selected') {
        content = labels.recommendationSelected;
      }
      if (m.kind === 'recommendation_rejected') {
        content = labels.recommendationRejected;
      }

      const base: ChatMessage = { id, role, content, timestamp: m.createdAt };
      if (m.kind === 'result' && m.role === 'agent' && m.options && !Array.isArray(m.options)) {
        base.resultKey = m.options.resultKey;
      }
      if (m.kind === 'question' && Array.isArray(m.options)) {
        base.agentOptions = m.options.map((o, i) => ({ ...o, id: o.id || `opt-${idx}-${i}` }));
      }
      if (m.role === 'agent' && m.options && !Array.isArray(m.options)
        && m.options.kind === 'recommendations') {
        const metadata = m.options;
        base.id = `recommendation-result-${id}`;
        const recommendations = metadata.benchmarks.flatMap((benchmark) => {
          const recommendation = detail.recommendations.find(
            (item) => item.testId === benchmark.testId,
          );
          return recommendation ? [recommendation] : [];
        });
        base.recommendations = recommendations.map((item) => item.testId);
        base.recommendationItems = recommendations.map((item) => ({
          testId: item.testId, id: item.id, status: item.status,
        }));
        base.pendingRecommendationId = recommendations[0]?.id;
        base.recommendationStatus = recommendations[0]?.status;
      }
      if (m.kind === 'result' && detail.intent !== 'create_new') {
        base.content = labels.recommendationResult;

        const rec = detail.recommendations.find(
          (r) => r.testId === m.content || m.content.includes(r.testId),
        );
        if (rec) {
          base.recommendations = [rec.testId];
          base.pendingRecommendationId = rec.id;
          base.recommendationStatus = rec.status;
        }
      }
      return base;
    });

  /**
   * Пользовательский поисковый текст хранится в RecommendationRequest,
   * поэтому восстанавливаем его как обычное user-сообщение.
   */
  const requestMessages: ChatMessage[] = detail.recommendationRequests.map(
    (request) => ({
      id: `recommendation-query-${request.id}`,
      role: 'user',
      content: request.query,
      timestamp: request.createdAt,
    }),
  );

  const persistedResultTestIds = new Set(
    persistedMessages.flatMap((message) => message.recommendations ?? []),
  );

  const requestResultMessages: ChatMessage[] = [];

  for (const request of detail.recommendationRequests) {
    if (request.status === 'pending') {
      /**
       * Обычный pending показывает loader. Если уже была retryable-ошибка,
       * дополнительно восстанавливаем понятное сообщение после навигации.
       */
      if (request.retryable && request.nextRetryAt) {
        requestResultMessages.push({
          id: `recommendation-result-${request.id}`,
          role: 'assistant',
          content: labels.recommendationRetrying,
          timestamp: request.updatedAt,
        });
      }

      continue;
    }

    const timestamp = request.completedAt ?? request.updatedAt;

    if (request.status === 'failed') {
      requestResultMessages.push({
        id: `recommendation-result-${request.id}`,
        role: 'assistant',
        content: labels.recommendationFailed,
        timestamp,
      });
      continue;
    }

    const testIds =
      request.resultPayload?.map((item) => item.testId) ?? [];
    const recommendations = testIds.flatMap((testId) => {
      const recommendation = detail.recommendations.find(
        (item) => item.testId === testId,
      );
      return recommendation ? [recommendation] : [];
    });
    const isAlreadyRepresented =
      testIds.length > 0 &&
      testIds.every((testId) =>
        persistedResultTestIds.has(testId),
      );
    const missingRecommendations = recommendations.filter(
      (recommendation) =>
        !persistedResultTestIds.has(recommendation.testId),
    );

    // Если результат уже представлен сохранённым Message, второй раз
    // синтетическое сообщение не создаём.
    if (isAlreadyRepresented) {
      continue;
    }

    const firstRecommendation = missingRecommendations[0];

    requestResultMessages.push({
      id: `recommendation-result-${request.id}`,
      role: 'assistant',
      content:
        testIds.length > 0
          ? formatRecommendationExplanations(
            request.resultPayload?.map((item) => item.explanation),
          ) || labels.recommendationResult
          : labels.recommendationEmpty,
      timestamp,
      recommendations: missingRecommendations.map(
        (recommendation) => recommendation.testId,
      ),
      recommendationItems: missingRecommendations.map((recommendation) => ({
        testId: recommendation.testId,
        id: recommendation.id,
        status: recommendation.status,
      })),
      pendingRecommendationId: firstRecommendation?.id,
      recommendationStatus: firstRecommendation?.status,
    });
  }

  return [
    ...persistedMessages,
    ...requestMessages,
    ...requestResultMessages,
  ].sort((left, right) => {
    const timeDifference =
      new Date(left.timestamp).getTime() -
      new Date(right.timestamp).getTime();

    return timeDifference || left.id.localeCompare(right.id);
  });
}
