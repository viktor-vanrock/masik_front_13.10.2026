import { useEffect, useEffectEvent, useRef } from 'react';
import { createChatSocket, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@/services/socket';
import type {
  ChatStartedPayload,
  WsErrorPayload,
  WsExceptionPayload,
} from '@/services/socket';
import { CONV_SESSION_KEY, CONV_STATUS_KEY, CONV_OWNER_KEY, clearAuthScopedStorage, emitUnauthorized } from '@/services/auth';
import { updateConversation } from '@/api/conversations';
import { DialoguePhase, DialogueStatus } from '@/types';
import {
  emittedStartChatIds,
  saveConvName,
  loadConvName,
} from '../../utils/conversationUtils';
import { saveDerivedIntent, saveEntrySession } from '../../utils/derivedIntent';
import { useApp } from '@/hooks/useApp';
import type { ConversationRefs } from './useConversationRefs';
import type { ConversationStateSetters, HistoryLabels } from './utils/types';
import { createConversationServerHandlers } from './utils/conversationServerHandlers';

export type UseConversationSocketOptions = {
  status: ReturnType<typeof useApp>['status'];
  userId: string | null;
  t: ReturnType<typeof useApp>['t'];
  refs: ConversationRefs;
  setters: ConversationStateSetters;
  historyLabelsRef: { current: HistoryLabels };
};

export function useConversationSocket({ status, userId, t, refs, setters, historyLabelsRef }: UseConversationSocketOptions): void {
  const {
    socketRef,
    activeConvIdRef,
    restoreRequestRef,
    selectionRequestRef,
    pendingNewSessionRef,
    pendingNewSessionSocketRef,
    queuedManualNewChatRef,
    startedEntryIntentRef,
    entryIntentKeyRef,
    freshDerivedEntryRef,
    locationRef,
    navigateRef,
    setActiveId,
  } = refs;
  const {
    setSocketDialogues,
    setIsTyping,
    setPendingSearchConversationId,
    setConnectionError,
    setEntryConversationId,
    setEntryAttemptVersion,
  } = setters;

  const reportConnectionLost = useEffectEvent(() => {
    setConnectionError(t.create.connectionLost);
  });
  const getRecommendationResultText = useEffectEvent((resultStatus: 'completed' | 'failed' | 'retrying', hasRecommendations: boolean): string => {
    if (resultStatus === 'failed') return t.create.recommendFailed;
    if (resultStatus === 'retrying') return t.create.recommendRetrying;
    return hasRecommendations ? t.create.recommendResult : t.create.recommendEmpty;
  });

  const prevUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
  // Socket живёт только при authenticated: любой другой статус → сокета нет (cleanup отключает).
    if (status !== 'authenticated' || !userId) return;

    const currentUserId = userId;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;
    const isIdentityBoundary =
    prevUserId !== null && currentUserId !== null && prevUserId !== currentUserId;
    if (isIdentityBoundary) {
      setSocketDialogues([]);
      setActiveId(null);
      setIsTyping(false);
      setPendingSearchConversationId(null);
      setConnectionError(null);
      pendingNewSessionRef.current = null;
      queuedManualNewChatRef.current = false;
      clearAuthScopedStorage();
    }

    let isActive = true;

    const socket = createChatSocket();
    socketRef.current = socket;

    // Guards against stale handlers from React StrictMode double-mount:
    // isActive becomes false on cleanup; socketRef check guards against the
    // new socket having replaced this one in the ref before cleanup ran.
    const isStaleSocket = () => !isActive || socketRef.current !== socket;

    const onConnect = () => {
      if (isStaleSocket()) return;
      setConnectionError(null);
      if (freshDerivedEntryRef.current && !pendingNewSessionRef.current) return;
      if (pendingNewSessionRef.current && pendingNewSessionSocketRef.current !== socket) {
        pendingNewSessionSocketRef.current = socket;
        socket.emit(WS_CLIENT_EVENTS.START_CHAT, {});
        return;
      }
      const activeConversationId = activeConvIdRef.current;
      const activeStatus = sessionStorage.getItem(CONV_STATUS_KEY);
      if (
        activeConversationId &&
      sessionStorage.getItem(CONV_SESSION_KEY) === activeConversationId &&
      sessionStorage.getItem(CONV_OWNER_KEY) === userId &&
      activeStatus !== 'abandoned' &&
      !emittedStartChatIds.has(activeConversationId)
      ) {
        emittedStartChatIds.add(activeConversationId);
        socket.emit(WS_CLIENT_EVENTS.START_CHAT, { conversationId: activeConversationId });
      }
    };

    const onChatStarted = (payload: ChatStartedPayload) => {
      if (isStaleSocket()) return;
      // Capture before resetting: true = brand-new session, false = resume.
      const pendingChat = pendingNewSessionRef.current;
      const wasNewSession = Boolean(pendingChat);
      pendingNewSessionRef.current = null;
      pendingNewSessionSocketRef.current = null;
      const { conversationId } = payload;
      if (pendingChat?.entryIntentKey && userId) {
        saveEntrySession(userId, pendingChat.entryIntentKey, conversationId);
        if (pendingChat.derivedIntent) saveDerivedIntent(userId, conversationId, pendingChat.derivedIntent);
        if (entryIntentKeyRef.current === pendingChat.entryIntentKey) {
          setEntryConversationId(conversationId);
          const currentLocation = locationRef.current;
          const params = new URLSearchParams(currentLocation.search);
          params.set('session', conversationId);
          navigateRef.current({ pathname: currentLocation.pathname, search: params.toString() }, { replace: true });
        } else {
          setEntryAttemptVersion((version) => version + 1);
        }
      }
      emittedStartChatIds.add(conversationId);
      sessionStorage.setItem(CONV_SESSION_KEY, conversationId);
      if (userId) sessionStorage.setItem(CONV_OWNER_KEY, userId);
      sessionStorage.setItem(CONV_STATUS_KEY, "active");
      setActiveId(conversationId);
      if (wasNewSession) {
        void updateConversation(conversationId, { title: pendingChat?.entryTitle || 'Новый бенчмарк' }).catch(() => undefined);
      }
      setSocketDialogues((prev) => {
        if (prev.find((d) => d.id === conversationId)) return prev;
        const now = new Date().toISOString();
        if (wasNewSession) {
        // New conversation starts with the default benchmark title.
          saveConvName(conversationId, pendingChat?.entryTitle || "Новый бенчмарк", pendingChat?.entryTitle || "New Benchmark");
          return [
            {
              id: conversationId,
              conversationId,
              conversationStatus: "active" as const,
              catalogSubmissionStatus: null,
              benchmarkName: pendingChat?.entryTitle || "Новый бенчмарк",
              benchmarkNameEn: pendingChat?.entryTitle || "New Benchmark",
              isArchived: false,
              startedAt: now,
              updatedAt: now,
              status: DialogueStatus.Interview,
              phase: DialoguePhase.Recommend,
              messages: [],
            },
            ...prev,
          ];
        }
        // Resume (sidebar click or page-load reconnect): append to preserve sidebar
        // position. REST hydration or selectDialogue will fill messages.
        const rn = loadConvName(conversationId);
        return [
          ...prev,
          {
            id: conversationId,
            conversationId,
            conversationStatus: "active" as const,
            catalogSubmissionStatus: null,
            benchmarkName: rn.ru,
            benchmarkNameEn: rn.en,
            isArchived: false,
            startedAt: now,
            updatedAt: now,
            status: DialogueStatus.InProgress,
            phase: DialoguePhase.Recommend,
            messages: [],
          },
        ];
      });
      if (queuedManualNewChatRef.current && userId && status === 'authenticated') {
        queuedManualNewChatRef.current = false;
        restoreRequestRef.current++;
        selectionRequestRef.current++;
        emittedStartChatIds.clear();
        pendingNewSessionRef.current = {};
        pendingNewSessionSocketRef.current = socket;
        setActiveId(null);
        setIsTyping(false);
        sessionStorage.removeItem(CONV_SESSION_KEY);
        sessionStorage.removeItem(CONV_OWNER_KEY);
        sessionStorage.removeItem(CONV_STATUS_KEY);
        try {
          socket.emit(WS_CLIENT_EVENTS.START_CHAT, {});
        } catch {
          pendingNewSessionRef.current = null;
          pendingNewSessionSocketRef.current = null;
          setConnectionError('Не удалось открыть чат. Повторите попытку.');
        }
      }
    };

    const {
      onRecommendationRequestAccepted,
      onRecommendationResult,
      onAgentMessage,
      onRecommendationUpdated,
      onBenchmarkCreationStarted,
    } = createConversationServerHandlers({
      isStaleSocket,
      userId,
      activeConvIdRef,
      historyLabelsRef,
      setters,
      getRecommendationResultText,
    });

    const onError = (payload: WsErrorPayload) => {
      if (isStaleSocket()) return;
      if (pendingNewSessionRef.current?.entryIntentKey) startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      queuedManualNewChatRef.current = false;
      pendingNewSessionSocketRef.current = null;
      setIsTyping(false);
      setConnectionError(payload.message);
    };

    const onException = (payload: WsExceptionPayload) => {
      if (isStaleSocket()) return;
      if (pendingNewSessionRef.current?.entryIntentKey) startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      queuedManualNewChatRef.current = false;
      pendingNewSessionSocketRef.current = null;
      setIsTyping(false);
      setConnectionError(payload.message);
      if (payload.message?.toLowerCase().includes("unauthorized")) {
        emitUnauthorized();
      }
    };

    socket.on("connect", onConnect);
    socket.on(WS_SERVER_EVENTS.CHAT_STARTED, onChatStarted);
    socket.on(WS_SERVER_EVENTS.AGENT_MESSAGE, onAgentMessage);
    socket.on(WS_SERVER_EVENTS.RECOMMENDATION_UPDATED, onRecommendationUpdated);
    socket.on(
      WS_SERVER_EVENTS.BENCHMARK_CREATION_STARTED,
      onBenchmarkCreationStarted,
    );
    socket.on(WS_SERVER_EVENTS.ERROR, onError);
    socket.on(WS_SERVER_EVENTS.EXCEPTION, onException);
    socket.on(
      WS_SERVER_EVENTS.RECOMMENDATION_REQUEST_ACCEPTED,
      onRecommendationRequestAccepted
    );
    socket.on(
      WS_SERVER_EVENTS.RECOMMENDATION_RESULT,
      onRecommendationResult
    );
    socket.on("disconnect", () => {
      if (isStaleSocket()) return;
      if (activeConvIdRef.current) emittedStartChatIds.delete(activeConvIdRef.current);
      setIsTyping(false);
      if (pendingNewSessionRef.current?.entryIntentKey) startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      queuedManualNewChatRef.current = false;
      pendingNewSessionSocketRef.current = null;
      reportConnectionLost();
    });
    socket.on("connect_error", (err) => {
      if (isStaleSocket()) return;
      if (pendingNewSessionRef.current?.entryIntentKey) startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      queuedManualNewChatRef.current = false;
      pendingNewSessionSocketRef.current = null;
      setConnectionError(err.message);
    });

    socket.connect();

    return () => {
      isActive = false;
      if (pendingNewSessionSocketRef.current === socket) {
        if (pendingNewSessionRef.current?.entryIntentKey) startedEntryIntentRef.current = null;
        pendingNewSessionRef.current = null;
        pendingNewSessionSocketRef.current = null;
      }
      queuedManualNewChatRef.current = false;
      // Cleanup intentionally removes whichever active conversation is current at unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (activeConvIdRef.current) emittedStartChatIds.delete(activeConvIdRef.current);
      socket.removeAllListeners();
      socket.disconnect();
      // Only null out the ref if it still points to this socket instance;
      // the second StrictMode mount may have already assigned a new socket.
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  // status/userId — реальные identity-зависимости lifecycle; остальные значения
  // стабильны/читаются через ref, поэтому список намеренно сокращён.
  }, [
    status,
    userId,
    setActiveId,
    activeConvIdRef,
    entryIntentKeyRef,
    freshDerivedEntryRef,
    historyLabelsRef,
    locationRef,
    navigateRef,
    pendingNewSessionRef,
    pendingNewSessionSocketRef,
    queuedManualNewChatRef,
    restoreRequestRef,
    selectionRequestRef,
    setConnectionError,
    setEntryAttemptVersion,
    setEntryConversationId,
    setIsTyping,
    setPendingSearchConversationId,
    setSocketDialogues,
    setters,
    socketRef,
    startedEntryIntentRef,
  ]);


}
