import type { MutableRefObject } from 'react';
import { DialoguePhase, DialogueStatus } from '@/types';
import { CONV_STATUS_KEY } from '@/services/auth';
import { getConversation, CONVERSATIONS_QUERY_KEYS } from '@/api/conversations';
import { getQueryClient } from '@/services/query';
import type {
  BenchmarkCreationStartedPayload,
  RecommendationRequestAcceptedPayload,
  RecommendationResultPayload,
  RecommendationUpdatedPayload,
} from '@/services/socket';
import { mapAgentPayloadToMessage, agentPayloadCompletesConversation, mapRecommendationUpdateToActionMessage, mapDetailToMessages, mergeConversationMessages, formatRecommendationExplanations } from '../../../utils/conversationUtils';
import { createAssistantMessage } from '../../../utils/messageFactory';
import type { ConversationStateSetters, HistoryLabels } from './types';

type Options = {
  isStaleSocket: () => boolean;
  userId: string | null;
  activeConvIdRef: MutableRefObject<string | null>;
  historyLabelsRef: MutableRefObject<HistoryLabels>;
  setters: ConversationStateSetters;
  getRecommendationResultText: (status: RecommendationResultPayload['status'], hasRecommendations: boolean) => string;
};

export function createConversationServerHandlers({
  isStaleSocket,
  userId,
  activeConvIdRef,
  historyLabelsRef,
  setters,
  getRecommendationResultText,
}: Options) {
  const { setSocketDialogues, setIsTyping, setPendingSearchConversationId, setConnectionError } = setters;

  const onRecommendationRequestAccepted = (
    payload: RecommendationRequestAcceptedPayload
  ) => {
    if (isStaleSocket()) return;

    // Pending RecommendationRequest уже сохранён до обращения к моделям.
    if (activeConvIdRef.current !== payload.conversationId) {
      return;
    }

    setConnectionError(null);
    setPendingSearchConversationId(payload.conversationId);

    /**
 * Обновляем серверный кэш conversation.
 * Позже GET начнёт возвращать также recommendationRequests.
 */
    void getQueryClient()?.invalidateQueries({
      queryKey:
  CONVERSATIONS_QUERY_KEYS.detail(userId ?? '', payload.conversationId),
    });
  };

  const onRecommendationResult = (
    payload: RecommendationResultPayload
  ) => {
    if (isStaleSocket()) return;

    const isActiveConversation =
    activeConvIdRef.current === payload.conversationId;

    // Результат другого диалога не должен менять loader текущего.
    if (isActiveConversation) {
      setIsTyping(payload.status === 'retrying');
      setConnectionError(null);
      if (payload.status !== 'retrying') setPendingSearchConversationId(null);
    }

    const hasRecommendations =
    payload.status === 'completed' &&
    payload.recommendations.length > 0;

    const resultMessage = createAssistantMessage(
      (payload.status === 'completed'
        ? payload.label || formatRecommendationExplanations(
          payload.explanations?.filter((item) => payload.recommendations.some(
            (recommendation) => recommendation.testId === item.testId,
          )).map((item) => item.explanation),
        )
        : undefined) || getRecommendationResultText(
        payload.status,
        hasRecommendations,
      ),
      payload.status === 'completed'
        ? {
          recommendations: payload.recommendations.map(
            (recommendation) => recommendation.testId,
          ),
          recommendationItems: payload.recommendations.map((recommendation) => ({
            testId: recommendation.testId,
            id: recommendation.id,
            status: recommendation.status,
          })),
          pendingRecommendationId:
          payload.recommendations[0]?.id,
          recommendationStatus:
          payload.recommendations[0]?.status,
        }
        : {},

      // Стабильный ID защищает от повторного Socket.IO-уведомления.
      `recommendation-result-${payload.requestId}`,
    );

    const nextConversationStatus = 'active' as const;

    if (isActiveConversation) {
      sessionStorage.setItem(
        CONV_STATUS_KEY,
        nextConversationStatus,
      );
    }

    setSocketDialogues((previousDialogues) =>
      previousDialogues.map((dialogue) => {
        if (
          dialogue.conversationId !== payload.conversationId
        ) {
          return dialogue;
        }

        // requestId образует стабильный message ID, поэтому повторное
        // уведомление не создаст вторую карточку.
        const resultAlreadyExists = dialogue.messages.some(
          (existingMessage) =>
            existingMessage.id === resultMessage.id,
        );

        return {
          ...dialogue,
          /**
         * retrying и final используют один стабильный message id.
         * Поэтому completed/failed заменяет промежуточный текст,
         * а не добавляет рядом второе сообщение.
         */
          messages: resultAlreadyExists
            ? dialogue.messages.map((message) =>
              message.id === resultMessage.id
                ? resultMessage
                : message,
            )
            : [...dialogue.messages, resultMessage],
          conversationStatus: nextConversationStatus,
          status: DialogueStatus.InProgress,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    // Socket даёт мгновенное обновление, REST остаётся источником
    // истины для последующей гидратации и reconnect.
    void getQueryClient()?.invalidateQueries({
      queryKey: CONVERSATIONS_QUERY_KEYS.detail(
        userId ?? '', payload.conversationId,
      ),
    });
  };

  const onAgentMessage = (payload: Parameters<typeof mapAgentPayloadToMessage>[0]) => {
    if (isStaleSocket()) return;
    // Prefer payload.conversationId (correct routing even if user switched chats).
    // Fall back to ref when the backend omits it (e.g. mock mode or legacy agent).
    const convId = payload.conversationId ?? activeConvIdRef.current;
    if (!convId) return;
    const isActiveConversation = convId === activeConvIdRef.current;
    if (isActiveConversation) setIsTyping(false);

    const newMsg = mapAgentPayloadToMessage(payload);

    const nextConvStatus = payload.type === 'result' && payload.content.status === 'generating'
      ? ('generating' as const)
      : agentPayloadCompletesConversation(payload)
        ? ("completed" as const)
        : undefined;
    if (nextConvStatus && isActiveConversation)
      sessionStorage.setItem(CONV_STATUS_KEY, nextConvStatus);
    if (nextConvStatus === 'generating') {
      void getQueryClient()?.invalidateQueries({
        queryKey: CONVERSATIONS_QUERY_KEYS.generation(userId ?? '', convId),
      });
    }

    setSocketDialogues((prev) =>
      prev.map((d) => {
        if (d.id !== convId) return d;
        // Dedup by stable DB id — prevents duplicate messages on resume/reconnect.
        if (d.messages.some((m) => m.id === newMsg.id)) return d;
        const convStatus = nextConvStatus ?? d.conversationStatus;
        const status =
        convStatus === "completed" || convStatus === "abandoned"
          ? DialogueStatus.Done
          : DialogueStatus.InProgress;
        return {
          ...d,
          messages: [...d.messages, newMsg],
          phase: nextConvStatus === 'generating' ? DialoguePhase.Create : d.phase,
          conversationStatus: convStatus,
          status,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const onRecommendationUpdated = (payload: RecommendationUpdatedPayload) => {
    if (isStaleSocket()) return;
    const actionMessage = mapRecommendationUpdateToActionMessage(
      payload,
      historyLabelsRef.current,
    );
    setSocketDialogues((prev) =>
      prev.map((d) => {
        if (d.conversationId !== payload.conversationId) return d;

        const matchingRecommendationMessage = d.messages.find(
          (message) =>
            message.recommendationItems?.some((item) => item.id === payload.id) ||
          (message.recommendations?.length === 1 &&
            (message.pendingRecommendationId === payload.id ||
              message.recommendations.includes(payload.testId))),
        );
        const matchingItem = matchingRecommendationMessage?.recommendationItems?.find(
          (item) => item.id === payload.id,
        );
        const shouldAddActionMessage =
        actionMessage !== null &&
        (matchingItem?.status ?? matchingRecommendationMessage?.recommendationStatus) !== payload.status &&
        !d.messages.some((message) => message.id === actionMessage.id);

        const updatedMessages = d.messages.map((m) => {
          if (m.recommendationItems?.some((item) => item.id === payload.id)) {
            return {
              ...m,
              recommendationItems: m.recommendationItems.map((item) =>
                item.id === payload.id ? { ...item, status: payload.status } : item,
              ),
            };
          }
          if (m.pendingRecommendationId === payload.id) {
            return { ...m, recommendationStatus: payload.status };
          }
          // Match by testId if a recovered recommendation message has no action ID.
          if (
            !m.pendingRecommendationId &&
          m.recommendations?.length === 1 &&
          m.recommendations.includes(payload.testId)
          ) {
            return {
              ...m,
              pendingRecommendationId: payload.id,
              recommendationStatus: payload.status,
            };
          }
          return m;
        });

        return {
          ...d,
          phase:
          payload.status === 'rejected'
            ? DialoguePhase.Create
            : d.phase,
          conversationStatus: 'active' as const,
          status: DialogueStatus.InProgress,
          messages: shouldAddActionMessage
            ? [...updatedMessages, actionMessage]
            : updatedMessages,
        };
      }),
    );
    // Recover saved actions and responses if a socket notification was lost.
    (async () => {
      await new Promise<void>((r) => setTimeout(r, 1200));
      try {
        if (isStaleSocket()) return;
        const detail = await getConversation(payload.conversationId);
        if (isStaleSocket()) return;
        const fresh = mapDetailToMessages(
          detail,
          historyLabelsRef.current,
        );
        const convStatus = detail.status;
        const nextStatus =
        convStatus === "completed" || convStatus === "abandoned"
          ? DialogueStatus.Done
          : undefined;
        setSocketDialogues((prev) =>
          prev.map((d) => {
            if (d.conversationId !== payload.conversationId) return d;
            const messages = mergeConversationMessages(
              d.messages,
              fresh,
            );
            return {
              ...d,
              messages,
              conversationStatus: convStatus ?? d.conversationStatus,
              catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
              benchmarkName: detail.title ?? d.benchmarkName,
              benchmarkNameEn: detail.title ?? d.benchmarkNameEn,
              isArchived: detail.isArchived ?? false,
              pinnedDate: detail.pinnedDate ?? null,
              ...(nextStatus ? { status: nextStatus } : {}),
            };
          }),
        );
      } catch {
      /* Non-critical. */
      }
    })();
    getQueryClient()?.invalidateQueries({
      queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId ?? '', payload.conversationId),
    });
  };

  const onBenchmarkCreationStarted = (
    payload: BenchmarkCreationStartedPayload,
  ) => {
    if (isStaleSocket()) return;
    if (activeConvIdRef.current === payload.conversationId) {
      setConnectionError(null);
    }
    setSocketDialogues((previous) =>
      previous.map((dialogue) =>
        dialogue.conversationId === payload.conversationId
          ? {
            ...dialogue,
            phase: DialoguePhase.Create,
            conversationStatus: 'active' as const,
            status: DialogueStatus.InProgress,
          }
          : dialogue,
      ),
    );
  };

  return {
    onRecommendationRequestAccepted,
    onRecommendationResult,
    onAgentMessage,
    onRecommendationUpdated,
    onBenchmarkCreationStarted,
  };
}
