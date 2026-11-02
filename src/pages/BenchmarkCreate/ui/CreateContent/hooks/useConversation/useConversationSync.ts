import { useEffect } from 'react';
import { ApiException } from '@/services/http';
import {
  CONVERSATIONS_QUERY_KEYS,
  getConversation,
} from '@/api/conversations';
import { getQueryClient } from '@/services/query';
import {
  CONV_OWNER_KEY,
  CONV_SESSION_KEY,
  CONV_STATUS_KEY,
  clearAuthScopedStorage,
} from '@/services/auth';
import { WS_CLIENT_EVENTS } from '@/services/socket';
import { DialoguePhase, DialogueStatus } from '@/types';
import { latestResponseState } from '../../utils/responseState';
import { restoreOutgoingMessage } from '../../utils/chatOutbox';
import {
  emittedStartChatIds,
  loadConvName,
  mapDetailToMessages,
  mergeConversationMessages,
} from '../../utils/conversationUtils';
import type { ConversationRefs } from './useConversationRefs';
import type { ConversationStateSetters, HistoryLabels } from './utils/types';

type SharedOptions = {
  userId: string | null;
  refs: ConversationRefs;
  setters: ConversationStateSetters;
  historyLabelsRef: { current: HistoryLabels };
};

type HydrationOptions = SharedOptions & {
  requestedSessionId: string | null;
  entryIntentKey?: string;
  forgetConversation: (id: string) => void;
};

export function useConversationHydration({
  userId,
  requestedSessionId,
  entryIntentKey,
  forgetConversation,
  refs,
  setters,
  historyLabelsRef,
}: HydrationOptions): void {
  const { activeConvIdRef, restoreRequestRef, socketRef, setActiveId, capturePinState, deletedConversationIdsRef } = refs;
  const { setSocketDialogues, setIsTyping, setPendingSearchConversationId } = setters;

  useEffect(() => {
    if (!userId || (entryIntentKey && !requestedSessionId)) return;
    const storedId = requestedSessionId ?? sessionStorage.getItem(CONV_SESSION_KEY);
    if (!storedId || deletedConversationIdsRef.current.has(storedId)) return;

    const storedOwner = sessionStorage.getItem(CONV_OWNER_KEY);
    if (storedOwner && storedOwner !== userId && !requestedSessionId) {
      clearAuthScopedStorage();
      return;
    }

    let cancelled = false;
    const restoreRequest = ++restoreRequestRef.current;

    void (async () => {
      try {
        const mergePin = capturePinState(storedId);
        const detail = await getConversation(storedId);
        if (cancelled || restoreRequestRef.current !== restoreRequest || deletedConversationIdsRef.current.has(storedId)) return;

        sessionStorage.setItem(CONV_SESSION_KEY, storedId);
        sessionStorage.setItem(CONV_OWNER_KEY, userId);
        sessionStorage.setItem(CONV_STATUS_KEY, detail.status);
        const switchedConversation = activeConvIdRef.current !== storedId;
        setActiveId(storedId);

        const messages = mapDetailToMessages(detail, historyLabelsRef.current);
        const hasPendingRequest = detail.recommendationRequests.some(
          (request) => request.status === 'pending',
        );
        setIsTyping(hasPendingRequest);
        setPendingSearchConversationId(hasPendingRequest ? storedId : null);

        const status = detail.status === 'completed' || detail.status === 'abandoned'
          ? DialogueStatus.Done
          : DialogueStatus.InProgress;
        setSocketDialogues((previous) => {
          const index = previous.findIndex((dialogue) => dialogue.id === storedId);
          const existing = index >= 0 ? previous[index] : undefined;
          const name = loadConvName(storedId);
          const updated = {
            id: storedId,
            conversationId: storedId,
            conversationStatus: detail.status,
            catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
            benchmarkName: detail.title ?? existing?.benchmarkName ?? name.ru,
            benchmarkNameEn: detail.title ?? existing?.benchmarkNameEn ?? name.en,
            isArchived: detail.isArchived ?? false,
            ...mergePin(detail, existing),
            startedAt: existing?.startedAt ?? detail.createdAt,
            status,
            phase: detail.intent === 'create_new' ? DialoguePhase.Create : DialoguePhase.Recommend,
            ...restoreOutgoingMessage(userId, storedId, existing?.outgoingMessage, detail.responseState,
              mergeConversationMessages(existing?.messages ?? [], messages), detail.messages),
            responseState: latestResponseState(existing?.responseState, detail.responseState, existing?.outgoingMessage?.requestId),
          };

          if (index < 0) return [updated, ...previous];
          const next = [...previous];
          next[index] = updated;
          return next;
        });

        if (detail.status !== 'abandoned' && (switchedConversation || !emittedStartChatIds.has(storedId))) {
          emittedStartChatIds.add(storedId);
          socketRef.current?.emit(WS_CLIENT_EVENTS.START_CHAT, { conversationId: storedId });
        }
      } catch (error) {
        if (!cancelled && restoreRequestRef.current === restoreRequest && error instanceof ApiException && [401, 403, 404].includes(error.status)) {
          forgetConversation(storedId);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [
    userId, requestedSessionId, entryIntentKey, forgetConversation,
    activeConvIdRef, restoreRequestRef, socketRef, setActiveId, setIsTyping,
    setPendingSearchConversationId, setSocketDialogues, historyLabelsRef, capturePinState, deletedConversationIdsRef,
  ]);
}

type RecoveryOptions = SharedOptions & {
  activeId: string | null;
  pendingSearchConversationId: string | null;
  responsePending: boolean;
};

export function useConversationRecovery({
  userId,
  activeId,
  pendingSearchConversationId,
  responsePending,
  refs,
  setters,
  historyLabelsRef,
}: RecoveryOptions): void {
  const { activeConvIdRef, capturePinState, deletedConversationIdsRef } = refs;
  const { setSocketDialogues, setIsTyping, setPendingSearchConversationId } = setters;

  useEffect(() => {
    if (!activeId || (pendingSearchConversationId !== activeId && !responsePending)) return;

    let cancelled = false;
    let requestInFlight = false;

    const recoverResult = async () => {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const mergePin = capturePinState(activeId);
        const detail = await getConversation(activeId);
        if (cancelled || activeConvIdRef.current !== activeId || deletedConversationIdsRef.current.has(activeId)) return;

        const hasPendingRequest = detail.recommendationRequests.some(
          (request) => request.status === 'pending',
        );
        const messages = mapDetailToMessages(detail, historyLabelsRef.current);

        const status = detail.status === 'completed' || detail.status === 'abandoned'
          ? DialogueStatus.Done
          : DialogueStatus.InProgress;
        setSocketDialogues((dialogues) => dialogues.map((dialogue) =>
          dialogue.conversationId === activeId
            ? {
              ...dialogue,
              ...restoreOutgoingMessage(userId, activeId, dialogue.outgoingMessage, detail.responseState,
                mergeConversationMessages(dialogue.messages, messages), detail.messages),
              retryingResponse: dialogue.retryingResponse && detail.responseState?.attempt === dialogue.responseState?.attempt,
              responseState: latestResponseState(dialogue.responseState, detail.responseState, dialogue.outgoingMessage?.requestId),
              conversationStatus: detail.status,
              catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
              benchmarkName: detail.title ?? dialogue.benchmarkName,
              benchmarkNameEn: detail.title ?? dialogue.benchmarkNameEn,
              isArchived: detail.isArchived ?? false,
              ...mergePin(detail, dialogue),
              status,
            }
            : dialogue,
        ));
        setIsTyping(hasPendingRequest);
        setPendingSearchConversationId(hasPendingRequest ? activeId : null);
        void getQueryClient()?.invalidateQueries({
          queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId ?? '', activeId),
        });
      } catch {
        // WebSocket remains the primary channel; the next poll retries recovery.
      } finally {
        requestInFlight = false;
      }
    };

    const timer = setInterval(() => { void recoverResult(); }, 5_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [
    userId, activeId, pendingSearchConversationId, responsePending, activeConvIdRef,
    setSocketDialogues, setIsTyping, setPendingSearchConversationId, historyLabelsRef, capturePinState, deletedConversationIdsRef,
  ]);
}
