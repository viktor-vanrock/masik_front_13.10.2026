import type { MutableRefObject } from 'react';
import { DialoguePhase, DialogueStatus } from '@/types';
import { CONV_STATUS_KEY } from '@/services/auth';
import { getConversation, refreshConversationDetail, CONVERSATIONS_QUERY_KEYS } from '@/api/conversations';
import { getQueryClient } from '@/services/query';
import type {
  BenchmarkCreationStartedPayload,
  RecommendationRequestAcceptedPayload,
  RecommendationResultPayload,
  RecommendationUpdatedPayload,
  ResponseStatePayload,
  AgentProgressPayload,
} from '@/services/socket';
import { dtoToDialogue, mapAgentPayloadToMessage, agentPayloadCompletesConversation, mapRecommendationUpdateToActionMessage, mapDetailToMessages, mergeConversationMessages, formatRecommendationExplanations } from '../../../utils/conversationUtils';
import { createAssistantMessage } from '../../../utils/messageFactory';
import { latestResponseState } from '../../../utils/responseState';
import { reconcileOutgoingMessage } from '../../../utils/chatOutbox';
import type { ConversationStateSetters, HistoryLabels } from './types';
import type { ConversationRefs } from '../useConversationRefs';

type Options = {
  isStaleSocket: () => boolean;
  userId: string | null;
  capturePinState: ConversationRefs['capturePinState'];
  deletedConversationIdsRef: ConversationRefs['deletedConversationIdsRef'];
  activeConvIdRef: MutableRefObject<string | null>;
  historyLabelsRef: MutableRefObject<HistoryLabels>;
  setters: ConversationStateSetters;
  getRecommendationResultText: (status: RecommendationResultPayload['status'], hasRecommendations: boolean) => string;
};

export function createConversationServerHandlers({
  isStaleSocket,
  userId,
  capturePinState,
  deletedConversationIdsRef,
  activeConvIdRef,
  historyLabelsRef,
  setters,
  getRecommendationResultText,
}: Options) {
  const { setSocketDialogues, setIsTyping, setPendingSearchConversationId, setConnectionError } = setters;

  const onRecommendationRequestAccepted = (
    payload: RecommendationRequestAcceptedPayload
  ) => {
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;

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
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;

    const isActiveConversation =
    activeConvIdRef.current === payload.conversationId;

    // Результат другого диалога не должен менять loader текущего.
    if (isActiveConversation) {
      if (payload.turnComplete !== false) setIsTyping(payload.status === 'retrying');
      setConnectionError(null);
      if (payload.turnComplete !== false && payload.status !== 'retrying') setPendingSearchConversationId(null);
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

    if (isActiveConversation && payload.turnComplete !== false) {
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
          conversationStatus: payload.turnComplete === false ? dialogue.conversationStatus : nextConversationStatus,
          status: payload.turnComplete === false ? dialogue.status : DialogueStatus.InProgress,
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
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
    // Prefer payload.conversationId (correct routing even if user switched chats).
    // Fall back to ref when the backend omits it (e.g. mock mode or legacy agent).
    const convId = payload.conversationId ?? activeConvIdRef.current;
    if (!convId) return;
    const isActiveConversation = convId === activeConvIdRef.current;
    if (payload.type === 'error' && !payload.requestId) {
      if (isActiveConversation) setConnectionError(payload.content.message);
      return;
    }
    const meaningful = payload.type === 'error' ? Boolean(payload.content.message.trim())
      : payload.type === 'hypotheses' ? payload.content.hypotheses.length > 0
        : Boolean(payload.content.label.trim());
    const startsGeneration = payload.type === 'result' && payload.content.status === 'generating';
    const briefReady = payload.type === 'result' && payload.content.status === 'brief_ready';
    if (!meaningful && !startsGeneration && !briefReady) return;
    void refreshConversationDetail(userId ?? '', convId);
    if (isActiveConversation && payload.turnComplete !== false && (meaningful || briefReady)) setIsTyping(false);

    const newMsg = meaningful ? mapAgentPayloadToMessage(payload) : null;

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
        if (d.responseState && payload.requestId === d.responseState.requestId && payload.attempt !== undefined
          && payload.attempt < d.responseState.attempt) return d;
        // Tracked failures are rendered once from persisted response_state.
        if (payload.type === 'error' && d.responseState?.status === 'failed'
          && payload.requestId === d.responseState.requestId && payload.attempt === d.responseState.attempt) return d;
        // Dedup by stable DB id — prevents duplicate messages on resume/reconnect.
        if (newMsg && d.messages.some((m) => m.id === newMsg.id)) return d;
        const convStatus = nextConvStatus ?? d.conversationStatus;
        const status =
        convStatus === "completed" || convStatus === "abandoned"
          ? DialogueStatus.Done
          : DialogueStatus.InProgress;
        return {
          ...d,
          messages: newMsg ? [...d.messages, newMsg] : d.messages,
          phase: nextConvStatus === 'generating' ? DialoguePhase.Create : d.phase,
          conversationStatus: convStatus,
          status,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const onResponseState = (payload: ResponseStatePayload) => {
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
    if (payload.responseState && activeConvIdRef.current === payload.conversationId) {
      setIsTyping(false);
      setConnectionError(null);
    }
    setSocketDialogues((previous) => {
      const exists = previous.some((dialogue) => dialogue.conversationId === payload.conversationId);
      if (!exists && payload.responseState) {
        return [...previous, {
          ...dtoToDialogue({ id: payload.conversationId, status: 'active',
            createdAt: payload.responseState.updatedAt, updatedAt: payload.responseState.updatedAt }),
          responseState: payload.responseState,
        }];
      }
      return previous.map((dialogue) => {
        if (dialogue.conversationId !== payload.conversationId) return dialogue;
        const responseState = latestResponseState(dialogue.responseState, payload.responseState, dialogue.outgoingMessage?.requestId);
        return { ...dialogue, responseState,
          outgoingMessage: reconcileOutgoingMessage(userId, payload.conversationId, dialogue.outgoingMessage, payload.responseState),
          retryingResponse: false,
          responseProgress: responseState?.status === 'pending' && responseState.requestId === dialogue.responseProgress?.requestId
            && responseState.attempt === dialogue.responseProgress.attempt ? dialogue.responseProgress : null };
      });
    });
  };

  const onAgentProgress = (payload: AgentProgressPayload) => {
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId) || typeof payload.message !== 'string' || !payload.message.trim()) return;
    setSocketDialogues((previous) => previous.map((dialogue) => {
      const response = dialogue.responseState;
      if (dialogue.id !== payload.conversationId || response?.status !== 'pending'
        || response.requestId !== payload.requestId || response.attempt !== payload.attempt) return dialogue;
      return { ...dialogue, responseProgress: { requestId: payload.requestId, attempt: payload.attempt, message: payload.message.trim() } };
    }));
  };

  const onRecommendationUpdated = (payload: RecommendationUpdatedPayload) => {
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
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
        if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
        const mergePin = capturePinState(payload.conversationId);
        const detail = await getConversation(payload.conversationId);
        if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
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
              responseState: latestResponseState(d.responseState, detail.responseState),
              conversationStatus: convStatus ?? d.conversationStatus,
              catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
              benchmarkName: detail.title ?? d.benchmarkName,
              benchmarkNameEn: detail.title ?? d.benchmarkNameEn,
              isArchived: detail.isArchived ?? false,
              ...mergePin(detail, d),
              updatedAt: d.updatedAt,
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
    if (isStaleSocket() || deletedConversationIdsRef.current.has(payload.conversationId ?? activeConvIdRef.current ?? '')) return;
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
    onResponseState,
    onAgentProgress,
    onRecommendationUpdated,
    onBenchmarkCreationStarted,
  };
}
