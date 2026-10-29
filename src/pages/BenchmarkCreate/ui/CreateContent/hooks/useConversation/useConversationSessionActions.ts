import { useCallback, useEffect, useRef } from 'react';
import { CONVERSATIONS_QUERY_KEYS, getConversation, updateConversation } from '@/api/conversations';
import { getQueryClient } from '@/services/query';
import { ApiException } from '@/services/http';
import { CONV_OWNER_KEY, CONV_SESSION_KEY, CONV_STATUS_KEY } from '@/services/auth';
import { WS_CLIENT_EVENTS } from '@/services/socket';
import { DialoguePhase, DialogueStatus } from '@/types';
import type { Dialogue } from '@/types';
import { emittedStartChatIds, loadConvName, mapDetailToMessages } from '../../utils/conversationUtils';
import { loadEntrySession } from '../../utils/derivedIntent';
import type { DerivedIntent } from '../../utils/derivedIntent';
import type { ConversationRefs } from './useConversationRefs';
import type { ConversationStateSetters, HistoryLabels, PendingNewChat } from './utils/types';
import type { Location, NavigateFunction } from 'react-router-dom';
import type { AuthStatus } from '@/context/auth/AuthContext';

type Options = {
  dialogues: Dialogue[];
  socketDialogues: Dialogue[];
  getConversationId: (dialogueId: string) => string | undefined;
  userId: string | null;
  status: AuthStatus;
  refs: ConversationRefs;
  setters: ConversationStateSetters;
  historyLabelsRef: { current: HistoryLabels };
  removeSessionParam: () => void;
  location: Location;
  navigate: NavigateFunction;
  entryIntentKey?: string;
  entryReady: boolean;
  entryTitle?: string;
  derivedIntent?: DerivedIntent | null;
  requestedSessionId: string | null;
  entryAttemptVersion: number;
};

export function useConversationSessionActions(options: Options) {
  const pendingPins = useRef(new Set<string>());
  const {
    dialogues, socketDialogues, getConversationId, userId, status, refs, setters,
    historyLabelsRef, removeSessionParam, location, navigate, entryIntentKey,
    entryReady, entryTitle, derivedIntent, requestedSessionId, entryAttemptVersion,
  } = options;
  const {
    socketRef, restoreRequestRef, selectionRequestRef,
    pendingNewSessionRef, pendingNewSessionSocketRef, queuedManualNewChatRef,
    startedEntryIntentRef, setActiveId,
  } = refs;
  const {
    setSocketDialogues, setIsTyping, setPendingSearchConversationId,
    setConnectionError, setEntryConversationId,
  } = setters;

  const selectDialogue = useCallback(
    (id: string) => {
      restoreRequestRef.current++;
      const selectionRequest = ++selectionRequestRef.current;
      const inSocket = socketDialogues.find((x) => x.id === id);
      const convId = inSocket?.conversationId ?? getConversationId(id);
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
              pinnedDate: detail.pinnedDate ?? null,
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
    [
      socketDialogues, getConversationId, setActiveId, removeSessionParam, userId,
      historyLabelsRef, restoreRequestRef, selectionRequestRef, setIsTyping,
      setPendingSearchConversationId, setSocketDialogues, socketRef,
    ],
  );

  const beginNewSession = useCallback((pendingChat: PendingNewChat) => {
    if (status !== 'authenticated' || !userId || !socketRef.current || pendingNewSessionRef.current) return false;
    const socket = socketRef.current;
    restoreRequestRef.current++;
    selectionRequestRef.current++;
    pendingNewSessionRef.current = pendingChat;
    pendingNewSessionSocketRef.current = socket;
    setActiveId(null);
    setIsTyping(false);
    emittedStartChatIds.clear();
    sessionStorage.removeItem(CONV_SESSION_KEY);
    sessionStorage.removeItem(CONV_OWNER_KEY);
    sessionStorage.removeItem(CONV_STATUS_KEY);
    if (!pendingChat.entryIntentKey) removeSessionParam();
    try {
      socket.emit(WS_CLIENT_EVENTS.START_CHAT, {});
      return true;
    } catch {
      if (pendingChat.entryIntentKey) startedEntryIntentRef.current = null;
      pendingNewSessionRef.current = null;
      pendingNewSessionSocketRef.current = null;
      setConnectionError('Не удалось открыть чат. Повторите попытку.');
      return false;
    }
  }, [
    removeSessionParam, setActiveId, status, userId, socketRef,
    pendingNewSessionRef, pendingNewSessionSocketRef, restoreRequestRef,
    selectionRequestRef, setIsTyping, setConnectionError, startedEntryIntentRef,
  ]);

  const startNewSession = useCallback(() => {
    if (status !== 'authenticated' || !userId) return;
    if (pendingNewSessionRef.current?.entryIntentKey) {
      queuedManualNewChatRef.current = true;
      return;
    }
    beginNewSession({});
  }, [beginNewSession, status, userId, pendingNewSessionRef, queuedManualNewChatRef]);

  const startEntrySession = useCallback(() => {
    if (!entryIntentKey || requestedSessionId || !userId || status !== 'authenticated') return;
    const scopedKey = `${userId}:${entryIntentKey}`;
    if (startedEntryIntentRef.current === scopedKey) return;
    const existingId = loadEntrySession(userId, entryIntentKey);
    if (existingId) {
      startedEntryIntentRef.current = scopedKey;
      const params = new URLSearchParams(location.search);
      params.set('session', existingId);
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
      return;
    }
    if (!entryReady) return;
    if (beginNewSession({ entryIntentKey, entryTitle, derivedIntent: derivedIntent ? { ...derivedIntent } : undefined })) {
      startedEntryIntentRef.current = scopedKey;
      setEntryConversationId(null);
    }
  }, [
    beginNewSession, derivedIntent, entryIntentKey, entryReady, entryTitle,
    location.pathname, location.search, navigate, requestedSessionId, status,
    userId, startedEntryIntentRef, setEntryConversationId,
  ]);

  useEffect(() => {
    // Creating a session on a ready entry route is intentional.
     
    startEntrySession();
  }, [startEntrySession, entryAttemptVersion]);

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
  }, [dialogues, setSocketDialogues]);

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
  }, [dialogues, setSocketDialogues]);

  const togglePin = useCallback(async (id: string) => {
    const target = dialogues.find((dialogue) => dialogue.id === id);
    if (!target?.conversationId || pendingPins.current.has(id)) return;
    pendingPins.current.add(id);
    const next = !target.pinnedDate;
    const optimisticPinnedDate = next ? new Date().toISOString() : null;
    setSocketDialogues((previous) => previous.some((dialogue) => dialogue.id === id)
      ? previous.map((dialogue) => dialogue.id === id ? { ...dialogue, pinnedDate: optimisticPinnedDate } : dialogue)
      : [{ ...target, pinnedDate: optimisticPinnedDate }, ...previous]);
    try {
      const updated = await updateConversation(target.conversationId, { isPinned: next });
      setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id === id
        ? { ...dialogue, pinnedDate: updated.pinnedDate ?? null, updatedAt: updated.updatedAt }
        : dialogue));
      void getQueryClient()?.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEYS.lists() });
    } catch {
      setSocketDialogues((previous) => previous.map((dialogue) =>
        dialogue.id === id ? { ...dialogue, pinnedDate: target.pinnedDate ?? null } : dialogue));
      setConnectionError('Не удалось изменить закрепление чата. Повторите попытку.');
    } finally {
      pendingPins.current.delete(id);
    }
  }, [dialogues, setSocketDialogues, setConnectionError]);

  return {
    togglePin,
    selectDialogue,
    startNewSession,
    retryEntrySession: startEntrySession,
    renameDialogue,
    toggleArchive,
  };
}
