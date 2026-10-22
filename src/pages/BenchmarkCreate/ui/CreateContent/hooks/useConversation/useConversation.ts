import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from "@/hooks/useApp";
import { CONV_SESSION_KEY, CONV_STATUS_KEY, CONV_OWNER_KEY } from '@/services/auth';
import { getQueryClient } from "@/services/query";
import {
  CONVERSATIONS_QUERY_KEYS,
  useConversationsQuery,
} from "@/api/conversations";
import type { Dialogue } from "@/types";
import { DialogueStatus } from "@/types";
import { useGeneration } from '../useGeneration';
import { useProduction } from '../useProduction';
import { dtoToDialogue } from '../../utils/conversationUtils';
import { loadEntrySession, removeEntrySession } from '../../utils/derivedIntent';
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
  const { data: conversationList } = useConversationsQuery(userId);

  // Socket-updated dialogues (new sessions + incoming messages + create-phase).
  const [socketDialogues, setSocketDialogues] = useState<Dialogue[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingSearchConversationId, setPendingSearchConversationId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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
  } = conversationRefs;
  const setters = useMemo(() => ({
    setSocketDialogues,
    setIsTyping,
    setPendingSearchConversationId,
    setConnectionError,
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
    (dialogueId: string) => conversationList?.find((conversation) => conversation.id === dialogueId)?.id,
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

  useConversationHydration({
    userId,
    requestedSessionId,
    entryIntentKey,
    forgetConversation,
    refs: conversationRefs,
    setters,
    historyLabelsRef,
  });

  useConversationSocket({ status, userId, t, refs: conversationRefs, setters, historyLabelsRef });

  useConversationRecovery({
    userId,
    activeId,
    pendingSearchConversationId,
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
    activeId,
    activeDialogue,
    isTyping,
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
    activeId,
    activeDialogue,
    entryConversationId: entryIntentKey && requestedSessionId ? requestedSessionId : entryConversationId,
    isTyping: isTyping && activeDialogue?.conversationStatus !== 'abandoned',
    connectionError,
    ...sessionActions,
    ...messageActions,
  };
}
