import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from "@/hooks/useApp";
import { CONV_SESSION_KEY, CONV_STATUS_KEY, CONV_OWNER_KEY } from '@/services/auth';
import { getQueryClient } from "@/services/query";
import {
  CONVERSATIONS_QUERY_KEYS,
  useSidebarConversationsQuery,
  useArchivedConversationsQuery,
  deleteConversation as deleteConversationRequest,
  removeConversationFromCache,
} from "@/api/conversations";
import type { Dialogue } from "@/types";
import { DialogueStatus } from "@/types";
import { useGeneration } from '../useGeneration';
import { useProduction } from '../useProduction';
import { dtoToDialogue } from '../../utils/conversationUtils';
import { responseErrorMessage } from '../../utils/responseState';
import { loadEntrySession, removeEntrySession, removeConversationIntent } from '../../utils/derivedIntent';
import { removeOutgoingMessage } from '../../utils/chatOutbox';
import { useConversationRefs } from './useConversationRefs';
import { useConversationSocket } from './useConversationSocket';
import { useConversationHydration, useConversationRecovery } from './useConversationSync';
import { useConversationSessionActions } from './useConversationSessionActions';
import { useConversationMessageActions } from './useConversationMessageActions';
import type { UseConversationOptions } from './utils/types';

export function useConversation({ entryIntentKey, entryReady = true, entryTitle, derivedIntent }: UseConversationOptions = {}) {
  const { t, status, user } = useApp();
  const userId = status === 'authenticated' ? user?.id ?? null : null;
  const location = useLocation();
  const navigate = useNavigate();
  const requestedSessionId = new URLSearchParams(location.search).get('session');
  const sidebarQuery = useSidebarConversationsQuery(userId);
  const archiveQuery = useArchivedConversationsQuery(userId);
  const conversationList = useMemo(() => {
    const pages = sidebarQuery.data?.pages ?? [];
    const first = pages[0];
    return first ? [
      ...first.pinned,
      ...pages.flatMap((page) => page.data),
      ...(archiveQuery.data?.pages.flatMap((page) => page.data) ?? []),
    ] : [];
  }, [sidebarQuery.data, archiveQuery.data]);

  // Socket-updated dialogues (new sessions + incoming messages + create-phase).
  const [socketDialogues, setSocketDialoguesState] = useState<Dialogue[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [transientTyping, setIsTyping] = useState(false);
  const [pendingSearchConversationId, setPendingSearchConversationId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [entryConversationId, setEntryConversationId] = useState<string | null>(entryIntentKey ? requestedSessionId : null);
  const [entryAttemptVersion, setEntryAttemptVersion] = useState(0);
  const conversationRefs = useConversationRefs({
    activeId,
    setActiveIdState,
    location,
    navigate,
    entryIntentKey,
    requestedSessionId,
  });
  const {
    activeConvIdRef,
    startedEntryIntentRef,
    setActiveId,
    deletedConversationIdsRef,
    pinUpdatesRef, locationRef, restoreRequestRef, selectionRequestRef, pendingNewSessionRef,
    pendingNewSessionSocketRef, queuedManualNewChatRef, socketRef,
  } = conversationRefs;
  const currentOwnerRef = useRef(userId);
  useEffect(() => {
    if (currentOwnerRef.current !== userId) { deletedConversationIdsRef.current.clear(); setDeletedIds(new Set()); }
    currentOwnerRef.current = userId;
  }, [userId, deletedConversationIdsRef]);
  const setSocketDialogues = useCallback<typeof setSocketDialoguesState>((next) => {
    setSocketDialoguesState(previous => (typeof next === 'function' ? next(previous) : next)
      .filter(dialogue => !deletedConversationIdsRef.current.has(dialogue.id)));
  }, [deletedConversationIdsRef]);
  const setters = useMemo(() => ({
    setSocketDialogues,
    setIsTyping,
    setPendingSearchConversationId,
    setConnectionError,
    setSocketConnected,
    setEntryConversationId,
    setEntryAttemptVersion,
  }), [
    setSocketDialogues, setIsTyping, setPendingSearchConversationId,
    setConnectionError, setEntryConversationId, setEntryAttemptVersion,
  ]);
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

  const removeSessionParam = useCallback(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('session')) return;
    params.delete('session');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const getConversationId = useCallback(
    (dialogueId: string) => conversationList.find((conversation) => conversation.id === dialogueId)?.id,
    [conversationList],
  );

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
    if (entryIntentKey && userId && loadEntrySession(userId, entryIntentKey) === id) {
      removeEntrySession(userId, entryIntentKey);
      startedEntryIntentRef.current = null;
    }
    if (activeConvIdRef.current === id) {
      setActiveId(null);
      setIsTyping(false);
      setPendingSearchConversationId(null);
    }
    setSocketDialogues((previous) => previous.filter((dialogue) => dialogue.id !== id));
    if (requestedSessionId === id) removeSessionParam();
    void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
  }, [
    activeConvIdRef, entryIntentKey, removeSessionParam, requestedSessionId,
    setActiveId, setIsTyping, setPendingSearchConversationId, setSocketDialogues,
    startedEntryIntentRef, userId,
  ]);

  const deleteDialogue = useCallback(async (id: string) => {
    if (!userId) return;
    await deleteConversationRequest(id);
    if (currentOwnerRef.current === userId) deletedConversationIdsRef.current.add(id);
    const cacheRemoval = removeConversationFromCache(userId, id);
    removeOutgoingMessage(userId, id);
    removeConversationIntent(userId, id);
    if (currentOwnerRef.current !== userId) { await cacheRemoval; return; }
    setDeletedIds(previous => new Set(previous).add(id));
    setSocketDialogues(previous => previous.filter(dialogue => dialogue.id !== id));
    pinUpdatesRef.current.delete(id);
    const currentSession = new URLSearchParams(locationRef.current.search).get('session');
    if (activeConvIdRef.current === id || currentSession === id || sessionStorage.getItem(CONV_SESSION_KEY) === id) {
      restoreRequestRef.current++;
      selectionRequestRef.current++;
      sessionStorage.removeItem(CONV_SESSION_KEY);
      sessionStorage.removeItem(CONV_STATUS_KEY);
      sessionStorage.removeItem(CONV_OWNER_KEY);
      startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      pendingNewSessionSocketRef.current = null;
      queuedManualNewChatRef.current = false;
      setActiveId(null);
      setIsTyping(false);
      setPendingSearchConversationId(null);
      setConnectionError(null);
      setEntryConversationId(null);
      navigate('/create', { replace: true });
      // Leave the deleted room; reconnect stays idle until the user opens a chat.
      socketRef.current?.disconnect();
      socketRef.current?.connect();
    }
    await cacheRemoval;
  }, [userId, deletedConversationIdsRef, setSocketDialogues, activeConvIdRef, startedEntryIntentRef, setActiveId, navigate,
    pinUpdatesRef, locationRef, restoreRequestRef, selectionRequestRef, pendingNewSessionRef, pendingNewSessionSocketRef, queuedManualNewChatRef, socketRef]);

  // Merge REST list (base) with socket-updated dialogues (override by id).
  const dialogues = useMemo<Dialogue[]>(() => {
    const socketIds = new Set(socketDialogues.map((d) => d.id));
    const restBase = conversationList
      .filter((c) => !socketIds.has(c.id))
      .map(dtoToDialogue);
    return [...socketDialogues, ...restBase].filter(dialogue => !deletedIds.has(dialogue.id));
  }, [socketDialogues, conversationList, deletedIds]);

  const storedDialogue = dialogues.find((d) => d.id === activeId) ?? null;
  const generationState = useGeneration(storedDialogue, userId);
  const productionState = useProduction(storedDialogue, generationState.generation?.status === 'succeeded', userId);
  const generationDialogue = generationState.generation && ['succeeded', 'failed', 'cancelled'].includes(generationState.generation.status) && storedDialogue
    ? { ...storedDialogue, status: DialogueStatus.Done, conversationStatus: 'completed' as const }
    : generationState.generation?.jobId && storedDialogue
      ? { ...storedDialogue, status: DialogueStatus.InProgress, conversationStatus: 'generating' as const }
      : storedDialogue;
  const responseState = generationDialogue?.responseState;
  const activeDialogue = generationDialogue && responseState?.status === 'failed' && !generationDialogue.retryingResponse && !generationDialogue.outgoingMessage
    ? { ...generationDialogue, messages: [...generationDialogue.messages, responseErrorMessage(responseState, t.create.responseFailed)] }
    : generationDialogue;
  // Legacy greetings/search actions have no responseState; ordinary sends use the durable state.
  const waitingForResponse = responseState?.status === 'pending' || transientTyping
    || Boolean(generationDialogue?.retryingResponse) || generationDialogue?.outgoingMessage?.delivery === 'sending';
  const canRetryResponse = !waitingForResponse && activeDialogue?.conversationStatus !== 'abandoned'
    && (activeDialogue?.outgoingMessage?.delivery === 'unconfirmed'
      || (responseState?.status === 'failed' && responseState.error?.retryable
        && activeDialogue?.messages.findLast((message) => message.role === 'user')?.id === responseState.userMessageId));

  useConversationHydration({
    userId,
    requestedSessionId,
    entryIntentKey,
    forgetConversation,
    refs: conversationRefs,
    setters,
    historyLabelsRef,
  });

  useConversationSocket({ status, userId, activeDialogue, t, refs: conversationRefs, setters, historyLabelsRef });

  useConversationRecovery({
    userId,
    activeId,
    pendingSearchConversationId,
    responsePending: responseState?.status === 'pending' || Boolean(generationDialogue?.outgoingMessage) || Boolean(generationDialogue?.retryingResponse),
    refs: conversationRefs,
    setters,
    historyLabelsRef,
  });

  const sessionActions = useConversationSessionActions({
    dialogues,
    socketDialogues,
    getConversationId,
    userId,
    status,
    refs: conversationRefs,
    setters,
    historyLabelsRef,
    removeSessionParam,
    location,
    navigate,
    entryIntentKey,
    entryReady,
    entryTitle,
    derivedIntent,
    requestedSessionId,
    entryAttemptVersion,
  });
  const messageActions = useConversationMessageActions({
    userId,
    activeId,
    activeDialogue,
    isTyping: waitingForResponse || Boolean(generationDialogue?.outgoingMessage),
    dialogues,
    socketDialogues,
    refs: conversationRefs,
    setters,
  });

  return {
    ...generationState,
    ...productionState,
    dialogues: activeDialogue
      ? dialogues.map((dialogue) => dialogue.id === activeDialogue.id ? activeDialogue : dialogue)
      : dialogues,
    loadMoreDialogues: sidebarQuery.fetchNextPage,
    hasMoreDialogues: sidebarQuery.hasNextPage,
    isLoadingMoreDialogues: sidebarQuery.isFetchingNextPage,
    loadMoreArchived: archiveQuery.fetchNextPage,
    hasMoreArchived: archiveQuery.hasNextPage,
    isLoadingMoreArchived: archiveQuery.isFetchingNextPage,
    archivedTotal: archiveQuery.data?.pages[0]?.total ?? 0,
    activeId,
    activeDialogue,
    entryConversationId: entryIntentKey && requestedSessionId ? requestedSessionId : entryConversationId,
    isTyping: waitingForResponse && activeDialogue?.conversationStatus !== 'abandoned',
    connectionError,
    responsePending: responseState?.status === 'pending' && activeDialogue?.conversationStatus !== 'abandoned',
    responseProgress: responseState?.status === 'pending'
      && activeDialogue?.responseProgress?.requestId === responseState.requestId
      && activeDialogue.responseProgress.attempt === responseState.attempt
      ? activeDialogue.responseProgress.message : null,
    briefProgress: responseState?.status === 'pending' && !activeDialogue?.retryingResponse
      ? responseState.progress : undefined,
    socketConnected: status === 'authenticated' && socketConnected,
    canRetryResponse: Boolean(canRetryResponse),
    deleteDialogue,
    ...sessionActions,
    ...messageActions,
  };
}
