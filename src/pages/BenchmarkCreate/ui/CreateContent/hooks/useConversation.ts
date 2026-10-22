import { useState, useMemo, useCallback, useRef, useEffect, useEffectEvent } from "react";
import type { Socket } from "socket.io-client";
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createChatSocket,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
} from "@/services/socket";
import type {
  BenchmarkCreationStartedPayload,
  ChatStartedPayload,
  RecommendationRequestAcceptedPayload,
  RecommendationResultPayload,
  RecommendationUpdatedPayload,
  WsErrorPayload,
  WsExceptionPayload,
} from "@/services/socket";
import { useApp } from "@/hooks/useApp";
import { CONV_SESSION_KEY, CONV_STATUS_KEY, CONV_OWNER_KEY, clearAuthScopedStorage, emitUnauthorized } from "@/services/auth";
import { ApiException } from '@/services/http';
import { getQueryClient } from "@/services/query";
import {
  CONVERSATIONS_QUERY_KEYS,
  getConversation,
  useConversationsQuery,
  updateConversation,
} from "@/api/conversations";
import type { Dialogue } from "@/types";
import { DialogueStatus, DialoguePhase } from "@/types";
import { useGeneration } from './useGeneration';
import { useProduction } from './useProduction';
import {
  createUserMessage,
  createAssistantMessage,
} from '../utils/messageFactory';
import {
  emittedStartChatIds,
  saveConvName,
  loadConvName,
  dtoToDialogue,
  mapDetailToMessages,
  mapAgentPayloadToMessage,
  agentPayloadCompletesConversation,
  mapRecommendationUpdateToActionMessage,
  mergeConversationMessages,
  formatRecommendationExplanations,
} from '../utils/conversationUtils';
import { saveDerivedIntent, type DerivedIntent } from '../utils/derivedIntent';

export function useConversation(entryIntentKey?: string, entryReady = true, entryTitle?: string, derivedIntent?: DerivedIntent | null) {
  const { t, status, user } = useApp();
  const userId = status === 'authenticated' ? user?.id ?? null : null;
  const location = useLocation();
  const navigate = useNavigate();
  const requestedSessionId = new URLSearchParams(location.search).get('session');
  const { data: conversationList } = useConversationsQuery(userId);

  // Socket-updated dialogues (new sessions + incoming messages + create-phase).
  const [socketDialogues, setSocketDialogues] = useState<Dialogue[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingSearchConversationId, setPendingSearchConversationId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [entryConversationId, setEntryConversationId] = useState<string | null>(entryIntentKey ? requestedSessionId : null);
  useEffect(() => {
    if (entryIntentKey && requestedSessionId) setEntryConversationId(requestedSessionId);
  }, [entryIntentKey, requestedSessionId]);
  const locationRef = useRef(location);
  locationRef.current = location;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const entryTitleRef = useRef(entryTitle);
  entryTitleRef.current = entryTitle;
  const derivedIntentRef = useRef(derivedIntent);
  derivedIntentRef.current = derivedIntent;
  const entryStartPendingRef = useRef(false);
  const freshDerivedEntryRef = useRef(Boolean(entryIntentKey && !requestedSessionId));
  freshDerivedEntryRef.current = Boolean(entryIntentKey && !requestedSessionId);

  /**
   * Ref позволяет REST hydration всегда использовать актуальный язык,
   * не добавляя локализацию в lifecycle-зависимости Socket.IO.
   */
  const historyLabels = useMemo(
    () => ({
      recommendationResult: t.create.recommendResult,
      recommendationEmpty: t.create.recommendEmpty,
      recommendationFailed: t.create.recommendFailed,
      recommendationRetrying: t.create.recommendRetrying,
      recommendationSelected: t.create.recommendYes,
      recommendationRejected: t.create.recommendNo,
    }),
    [
      t.create.recommendEmpty,
      t.create.recommendFailed,
      t.create.recommendNo,
      t.create.recommendResult,
      t.create.recommendRetrying,
      t.create.recommendYes,
    ],
  );
  const historyLabelsRef = useRef(historyLabels);

  useEffect(() => {
    historyLabelsRef.current = historyLabels;
  }, [historyLabels]);

  const socketRef = useRef<Socket | null>(null);
  // Ref copy of activeId so socket event listeners always see the current value.
  const activeConvIdRef = useRef<string | null>(activeId);
  const restoreRequestRef = useRef(0);
  const selectionRequestRef = useRef(0);
  useEffect(() => {
    const counter = selectionRequestRef;
    return () => { counter.current++; };
  }, []);
  // Guards against duplicate start_chat {} emits when user clicks "New Chat" multiple times
  // before the first chat_started arrives (Socket.IO buffers all emits when disconnected).
  const pendingNewSessionRef = useRef(false);
  const pendingNewSessionSocketRef = useRef<Socket | null>(null);

  // Effect Event: socket handlers read the current language without reconnecting on switch.
  const reportConnectionLost = useEffectEvent(() => {
    setConnectionError(t.create.connectionLost);
  });

  /**
   * Effect Event читает актуальную локаль, не пересоздавая
   * Socket.IO-соединение при переключении языка.
   */
  const getRecommendationResultText = useEffectEvent(
    (
      resultStatus: RecommendationResultPayload['status'],
      hasRecommendations: boolean,
    ): string => {
      if (resultStatus === 'failed') {
        return t.create.recommendFailed;
      }

      if (resultStatus === 'retrying') {
        return t.create.recommendRetrying;
      }

      return hasRecommendations
        ? t.create.recommendResult
        : t.create.recommendEmpty;
    },
  );

  const setActiveId = useCallback((id: string | null) => {
    if (activeConvIdRef.current && activeConvIdRef.current !== id) {
      emittedStartChatIds.delete(activeConvIdRef.current);
    }
    activeConvIdRef.current = id;
    setActiveIdState(id);
  }, []);

  const removeSessionParam = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('session')) return;
    params.delete('session');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const forgetConversation = useCallback((id: string) => {
    if (
      activeConvIdRef.current !== id &&
      sessionStorage.getItem(CONV_SESSION_KEY) !== id &&
      requestedSessionId !== id
    ) return;
    if (sessionStorage.getItem(CONV_SESSION_KEY) === id) {
      sessionStorage.removeItem(CONV_SESSION_KEY);
      sessionStorage.removeItem(CONV_STATUS_KEY);
      sessionStorage.removeItem(CONV_OWNER_KEY);
    }
    if (activeConvIdRef.current === id) {
      setActiveId(null);
      setIsTyping(false);
      setPendingSearchConversationId(null);
    }
    setSocketDialogues((previous) => previous.filter((dialogue) => dialogue.id !== id));
    if (requestedSessionId === id) removeSessionParam();
    void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
  }, [removeSessionParam, requestedSessionId, setActiveId]);

  // Merge REST list (base) with socket-updated dialogues (override by id).
  const dialogues = useMemo<Dialogue[]>(() => {
    const socketIds = new Set(socketDialogues.map((d) => d.id));
    const restBase = (conversationList ?? [])
      .filter((c) => !socketIds.has(c.id))
      .map(dtoToDialogue);
    return [...socketDialogues, ...restBase];
  }, [socketDialogues, conversationList]);

  const storedDialogue = dialogues.find((d) => d.id === activeId) ?? null;
  const generationState = useGeneration(storedDialogue, userId);
  const productionState = useProduction(storedDialogue, generationState.generation?.status === 'succeeded', userId);
  const activeDialogue = generationState.generation && ['succeeded', 'failed', 'cancelled'].includes(generationState.generation.status) && storedDialogue
    ? { ...storedDialogue, status: DialogueStatus.Done, conversationStatus: 'completed' as const }
    : generationState.generation?.jobId && storedDialogue
      ? { ...storedDialogue, status: DialogueStatus.InProgress, conversationStatus: 'generating' as const }
      : storedDialogue;

  // ─── Hydrate REST history on initial load ─────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    if (entryIntentKey && !requestedSessionId) return;
    const storedId = requestedSessionId ?? sessionStorage.getItem(CONV_SESSION_KEY);
    if (!storedId) return;
    const storedOwner = sessionStorage.getItem(CONV_OWNER_KEY);
    if (storedOwner && storedOwner !== userId && !requestedSessionId) {
      clearAuthScopedStorage();
      return;
    }

    let cancelled = false;
    const restoreRequest = ++restoreRequestRef.current;

    (async () => {
      try {
        const detail = await getConversation(storedId);
        if (cancelled || restoreRequestRef.current !== restoreRequest) return;
        sessionStorage.setItem(CONV_SESSION_KEY, storedId);
        sessionStorage.setItem(CONV_OWNER_KEY, userId);
        sessionStorage.setItem(CONV_STATUS_KEY, detail.status);
        const switchedConversation = activeConvIdRef.current !== storedId;
        setActiveId(storedId);
        const messages = mapDetailToMessages(
          detail,
          historyLabelsRef.current,
        );
        setIsTyping(
          detail.recommendationRequests.some(
            (request) => request.status === 'pending',
          ),
        );
        setPendingSearchConversationId(detail.recommendationRequests.some(
          (request) => request.status === 'pending',
        ) ? storedId : null);

        const convStatus = detail.status;
        const status =
          convStatus === "completed" || convStatus === "abandoned"
            ? DialogueStatus.Done
            : DialogueStatus.InProgress;

        setSocketDialogues((prev) => {
          const idx = prev.findIndex((d) => d.id === storedId);
          const n = loadConvName(storedId);
          const updated: Dialogue =
            idx >= 0
              ? {
                ...prev[idx],
                messages,
                benchmarkName: detail.title ?? prev[idx].benchmarkName ?? n.ru,
                benchmarkNameEn: detail.title ?? prev[idx].benchmarkNameEn ?? n.en,
                isArchived: detail.isArchived ?? false,
                phase:
                  detail.intent === 'create_new'
                    ? DialoguePhase.Create
                    : DialoguePhase.Recommend,
                conversationStatus: convStatus,
                catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
                status,
                updatedAt: detail.updatedAt,
              }
              : {
                id: storedId,
                conversationId: storedId,
                conversationStatus: convStatus,
                catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
                benchmarkName: detail.title ?? n.ru,
                benchmarkNameEn: detail.title ?? n.en,
                isArchived: detail.isArchived ?? false,
                startedAt: detail.createdAt,
                updatedAt: detail.updatedAt,
                status,
                phase:
                  detail.intent === 'create_new'
                    ? DialoguePhase.Create
                    : DialoguePhase.Recommend,
                messages,
              };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [updated, ...prev];
        });
        // Resume only after REST has confirmed access to the session.
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

    return () => {
      cancelled = true;
    };
  }, [userId, requestedSessionId, entryIntentKey, forgetConversation, setActiveId]);

  // ─── Socket setup (once on mount) ─────────────────────────────────────────

  const prevUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    // Socket живёт только при authenticated: любой другой статус → сокета нет (cleanup отключает).
    if (status !== 'authenticated') return;

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
      pendingNewSessionRef.current = false;
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
      const wasNewSession = pendingNewSessionRef.current;
      pendingNewSessionRef.current = false;
      pendingNewSessionSocketRef.current = null;
      const { conversationId } = payload;
      if (wasNewSession && entryStartPendingRef.current) {
        setEntryConversationId(conversationId);
        entryStartPendingRef.current = false;
        if (userId && derivedIntentRef.current) {
          saveDerivedIntent(userId, conversationId, derivedIntentRef.current);
        }
        const currentLocation = locationRef.current;
        const params = new URLSearchParams(currentLocation.search);
        params.set('session', conversationId);
        navigateRef.current({ pathname: currentLocation.pathname, search: params.toString() }, { replace: true });
      }
      emittedStartChatIds.add(conversationId);
      sessionStorage.setItem(CONV_SESSION_KEY, conversationId);
      if (userId) sessionStorage.setItem(CONV_OWNER_KEY, userId);
      sessionStorage.setItem(CONV_STATUS_KEY, "active");
      setActiveId(conversationId);
      if (wasNewSession) {
        void updateConversation(conversationId, { title: entryTitleRef.current || 'Новый бенчмарк' }).catch(() => undefined);
      }
      setSocketDialogues((prev) => {
        if (prev.find((d) => d.id === conversationId)) return prev;
        const now = new Date().toISOString();
        if (wasNewSession) {
          // New conversation starts with the default benchmark title.
          saveConvName(conversationId, entryTitleRef.current || "Новый бенчмарк", entryTitleRef.current || "New Benchmark");
          return [
            {
              id: conversationId,
              conversationId,
              conversationStatus: "active" as const,
              catalogSubmissionStatus: null,
              benchmarkName: entryTitleRef.current || "Новый бенчмарк",
              benchmarkNameEn: entryTitleRef.current || "New Benchmark",
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
    };

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

    const onError = (payload: WsErrorPayload) => {
      if (isStaleSocket()) return;
      pendingNewSessionRef.current = false;
      pendingNewSessionSocketRef.current = null;
      setIsTyping(false);
      setConnectionError(payload.message);
    };

    const onException = (payload: WsExceptionPayload) => {
      if (isStaleSocket()) return;
      pendingNewSessionRef.current = false;
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
      pendingNewSessionRef.current = false;
      pendingNewSessionSocketRef.current = null;
      reportConnectionLost();
    });
    socket.on("connect_error", (err) => {
      if (isStaleSocket()) return;
      pendingNewSessionRef.current = false;
      pendingNewSessionSocketRef.current = null;
      setConnectionError(err.message);
    });

    socket.connect();

    return () => {
      isActive = false;
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
  }, [status, userId, setActiveId]);

  // ─── REST recovery while an asynchronous recommendation is pending ─────────
  useEffect(() => {
    if (!activeId || pendingSearchConversationId !== activeId) return;

    let cancelled = false;
    let requestInFlight = false;

    const recoverResult = async () => {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const detail = await getConversation(activeId);
        if (cancelled || activeConvIdRef.current !== activeId) return;

        const hasPendingRequest = detail.recommendationRequests.some(
          (request) => request.status === 'pending',
        );

        const messages = mapDetailToMessages(
          detail,
          historyLabelsRef.current,
        );

        if (hasPendingRequest) {
          const hasScheduledRetry =
            detail.recommendationRequests.some(
              (request) =>
                request.status === 'pending' &&
                request.retryable &&
                request.nextRetryAt,
            );

          /**
           * Если retrying WebSocket потерялся, REST всё равно добавит
           * промежуточное сообщение. Для обычного pending loader достаточен.
           */
          if (hasScheduledRetry) {
            setSocketDialogues((dialogues) =>
              dialogues.map((dialogue) =>
                dialogue.conversationId === activeId
                  ? {
                    ...dialogue,
                    messages,
                    catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
                    benchmarkName: detail.title ?? dialogue.benchmarkName,
                    benchmarkNameEn: detail.title ?? dialogue.benchmarkNameEn,
                    isArchived: detail.isArchived ?? false,
                    updatedAt: detail.updatedAt,
                  }
                  : dialogue,
              ),
            );
          }

          return;
        }

        const dialogueStatus =
          detail.status === 'completed' ||
          detail.status === 'abandoned'
            ? DialogueStatus.Done
            : DialogueStatus.InProgress;

        setSocketDialogues((dialogues) =>
          dialogues.map((dialogue) =>
            dialogue.conversationId === activeId
              ? {
                ...dialogue,
                messages,
                conversationStatus: detail.status,
                catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
                benchmarkName: detail.title ?? dialogue.benchmarkName,
                benchmarkNameEn: detail.title ?? dialogue.benchmarkNameEn,
                isArchived: detail.isArchived ?? false,
                status: dialogueStatus,
                updatedAt: detail.updatedAt,
              }
              : dialogue,
          ),
        );
        setIsTyping(false);
        setPendingSearchConversationId(null);

        void getQueryClient()?.invalidateQueries({
          queryKey: CONVERSATIONS_QUERY_KEYS.detail(userId ?? '', activeId),
        });
      } catch {
        // WebSocket остаётся основным быстрым каналом; polling повторится.
      } finally {
        requestInFlight = false;
      }
    };

    const timer = setInterval(() => {
      void recoverResult();
    }, 5_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeId, pendingSearchConversationId, userId]);

  const selectDialogue = useCallback(
    (id: string) => {
      restoreRequestRef.current++;
      const selectionRequest = ++selectionRequestRef.current;
      const inSocket = socketDialogues.find((x) => x.id === id);
      const convId =
        inSocket?.conversationId ??
        conversationList?.find((c) => c.id === id)?.id;
      // Local mock dialogues (Create phase, id = dlg-*) have no conversationId → skip socket.
      if (!convId) {
        setActiveId(id);
        return;
      }

      setActiveId(null);
      setIsTyping(false); // Clear any pending typing state from the previous conversation.
      removeSessionParam();
      sessionStorage.removeItem(CONV_SESSION_KEY);
      sessionStorage.removeItem(CONV_STATUS_KEY);
      sessionStorage.removeItem(CONV_OWNER_KEY);

      (async () => {
        try {
          const detail = await getConversation(convId);
          if (selectionRequestRef.current !== selectionRequest) return;

          sessionStorage.setItem(CONV_SESSION_KEY, convId);
          if (userId) sessionStorage.setItem(CONV_OWNER_KEY, userId);
          sessionStorage.setItem(CONV_STATUS_KEY, detail.status);
          setActiveId(convId);
          setIsTyping(detail.recommendationRequests.some((request) => request.status === 'pending'));
          setPendingSearchConversationId(detail.recommendationRequests.some(
            (request) => request.status === 'pending',
          ) ? convId : null);

          const messages = mapDetailToMessages(detail, historyLabelsRef.current);
          const dialogueStatus =
            detail.status === 'completed' || detail.status === 'abandoned'
              ? DialogueStatus.Done
              : DialogueStatus.InProgress;
          setSocketDialogues((previous) => {
            const existing = previous.find((dialogue) => dialogue.id === convId);
            const name = loadConvName(convId);
            const updated: Dialogue = {
              id: convId,
              conversationId: convId,
              conversationStatus: detail.status,
              catalogSubmissionStatus: detail.catalogSubmission?.status ?? null,
              benchmarkName: detail.title ?? existing?.benchmarkName ?? name.ru,
              benchmarkNameEn: detail.title ?? existing?.benchmarkNameEn ?? name.en,
              isArchived: detail.isArchived ?? false,
              startedAt: detail.createdAt,
              updatedAt: detail.updatedAt,
              status: dialogueStatus,
              phase: detail.intent === 'create_new' ? DialoguePhase.Create : DialoguePhase.Recommend,
              messages,
            };
            return existing
              ? previous.map((dialogue) => dialogue.id === convId ? updated : dialogue)
              : [updated, ...previous];
          });

          if (
            detail.status !== 'abandoned' &&
            !emittedStartChatIds.has(convId)
          ) {
            emittedStartChatIds.add(convId);
            socketRef.current?.emit(WS_CLIENT_EVENTS.START_CHAT, { conversationId: convId });
          }
        } catch (error) {
          if (selectionRequestRef.current !== selectionRequest) return;
          if (error instanceof ApiException && [401, 403, 404].includes(error.status)) {
            setSocketDialogues((previous) => previous.filter((dialogue) => dialogue.id !== convId));
            void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
          }
        }
      })();
    },
    [socketDialogues, conversationList, setActiveId, removeSessionParam, userId],
  );

  const startNewSession = useCallback(() => {
    if (pendingNewSessionRef.current) return;
    restoreRequestRef.current++;
    selectionRequestRef.current++;
    pendingNewSessionRef.current = true;
    pendingNewSessionSocketRef.current = socketRef.current;
    setActiveId(null);
    setIsTyping(false);
    emittedStartChatIds.clear();
    sessionStorage.removeItem(CONV_SESSION_KEY);
    sessionStorage.removeItem(CONV_OWNER_KEY);
    sessionStorage.removeItem(CONV_STATUS_KEY);
    removeSessionParam();
    socketRef.current?.emit(WS_CLIENT_EVENTS.START_CHAT, {});
  }, [removeSessionParam, setActiveId]);

  const startedEntryIntentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!entryIntentKey || !entryReady || requestedSessionId || !userId || status !== 'authenticated') return;
    const scopedKey = `${userId}:${entryIntentKey}`;
    if (startedEntryIntentRef.current === scopedKey) return;
    startedEntryIntentRef.current = scopedKey;
    entryStartPendingRef.current = true;
    setEntryConversationId(null);
    startNewSession();
  }, [entryIntentKey, entryReady, requestedSessionId, status, startNewSession, userId]);

  const renameDialogue = useCallback(async (id: string, name: string) => {
    const target = dialogues.find((dialogue) => dialogue.id === id);
    if (!target?.conversationId) return;
    const previousName = target.benchmarkName;
    const previousNameEn = target.benchmarkNameEn;
    setSocketDialogues((previous) =>
      previous.map((dialogue) =>
        dialogue.id === id ? { ...dialogue, benchmarkName: name, benchmarkNameEn: name } : dialogue,
      ),
    );
    try {
      await updateConversation(target.conversationId, { title: name });
      void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
    } catch {
      setSocketDialogues((previous) =>
        previous.map((dialogue) =>
          dialogue.id === id
            ? { ...dialogue, benchmarkName: previousName, benchmarkNameEn: previousNameEn }
            : dialogue,
        ),
      );
    }
  }, [dialogues]);

  const toggleArchive = useCallback(async (id: string) => {
    const target = dialogues.find((dialogue) => dialogue.id === id);
    if (!target?.conversationId) return;
    const next = !target.isArchived;
    setSocketDialogues((previous) => {
      return previous.some((dialogue) => dialogue.id === id)
        ? previous.map((dialogue) => dialogue.id === id ? { ...dialogue, isArchived: next } : dialogue)
        : [{ ...target, isArchived: next }, ...previous];
    });
    try {
      await updateConversation(target.conversationId, { isArchived: next });
      void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
    } catch {
      setSocketDialogues((previous) =>
        previous.map((dialogue) =>
          dialogue.id === id ? { ...dialogue, isArchived: !next } : dialogue,
        ),
      );
    }
  }, [dialogues]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeId || isTyping) return;
      if (activeDialogue?.conversationStatus === 'abandoned') return;

      const target = socketDialogues.find((d) => d.id === activeId);

      if (
        target?.conversationId &&
        target.conversationStatus !== 'abandoned'
      ) {
        const userMsg = createUserMessage(trimmed);
        setSocketDialogues((previous) =>
          previous.map((dialogue) =>
            dialogue.id === activeId
              ? {
                ...dialogue,
                messages: [...dialogue.messages, userMsg],
                updatedAt: new Date().toISOString(),
                status: DialogueStatus.InProgress,
              }
              : dialogue,
          ),
        );
        setIsTyping(true);
        socketRef.current?.emit(WS_CLIENT_EVENTS.SEND_MESSAGE, {
          conversationId: target.conversationId,
          kind: 'text',
          value: trimmed,
        });
      }
    },
    [activeId, isTyping, socketDialogues, activeDialogue?.conversationStatus],
  );

  const sendOptionMessage = useCallback(
    (optionId: string, optionLabel: string) => {
      if (!activeId || isTyping) return;
      if (activeDialogue?.conversationStatus === 'abandoned') return;
      const target = socketDialogues.find((d) => d.id === activeId);
      if (!target?.conversationId || target.conversationStatus === 'abandoned')
        return;

      const userMsg = createUserMessage(optionLabel);
      setSocketDialogues((prev) =>
        prev.map((d) =>
          d.id !== activeId
            ? d
            : {
              ...d,
              messages: [...d.messages, userMsg],
              updatedAt: new Date().toISOString(),
              status:
                  d.status === DialogueStatus.Interview
                    ? DialogueStatus.InProgress
                    : d.status,
            },
        ),
      );
      setIsTyping(true);
      socketRef.current?.emit(WS_CLIENT_EVENTS.SEND_MESSAGE, {
        conversationId: target.conversationId,
        kind: "option",
        value: optionId,
        label: optionLabel,
      });
    },
    [activeId, isTyping, socketDialogues, activeDialogue?.conversationStatus],
  );

  const acceptRecommendation = useCallback((recommendationId: string) => {
    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.SELECT_RECOMMENDATION, {
      recommendationId,
    });
  }, []);

  const rejectRecommendation = useCallback((recommendationId: string) => {
    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.REJECT_RECOMMENDATION, {
      recommendationId,
    });
  }, []);

  const skipRecommendToCreate = useCallback(() => {
    if (!activeId || isTyping) return;
    const target = dialogues.find((dialogue) => dialogue.id === activeId);
    if (!target?.conversationId || target.phase !== DialoguePhase.Recommend
      || (target.conversationStatus !== 'active' && target.conversationStatus !== 'awaiting_choice')) return;

    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.START_BENCHMARK_CREATION, {
      conversationId: target.conversationId,
    });
  }, [activeId, isTyping, dialogues]);

  const startDerivedCreation = useCallback((initialMessage: string) => {
    if (!activeId || isTyping || !initialMessage.trim()) return false;
    const target = dialogues.find((dialogue) => dialogue.id === activeId);
    if (!target?.conversationId || target.phase !== DialoguePhase.Recommend ||
      target.conversationStatus === 'abandoned' || target.conversationStatus === 'generating') return false;

    setIsTyping(true);
    setSocketDialogues((previous) => previous.map((dialogue) =>
      dialogue.id === activeId
        ? { ...dialogue, messages: [...dialogue.messages, createUserMessage(initialMessage)] }
        : dialogue,
    ));
    socketRef.current?.emit(WS_CLIENT_EVENTS.START_BENCHMARK_CREATION, {
      conversationId: target.conversationId,
      initialMessage,
    });
    return true;
  }, [activeId, isTyping, dialogues]);

  return {
    ...generationState,
    ...productionState,
    dialogues: activeDialogue
      ? dialogues.map((dialogue) => dialogue.id === activeDialogue.id ? activeDialogue : dialogue)
      : dialogues,
    activeId,
    activeDialogue,
    entryConversationId,
    isTyping: isTyping && activeDialogue?.conversationStatus !== 'abandoned',
    connectionError,
    selectDialogue,
    startNewSession,
    startDerivedCreation,
    renameDialogue,
    toggleArchive,
    sendMessage,
    sendOptionMessage,
    acceptRecommendation,
    rejectRecommendation,
    skipRecommendToCreate,
  };
}
