import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import type { PendingNewChat } from './utils/types';
import { emittedStartChatIds } from '../../utils/conversationUtils';

type Options = {
  activeId: string | null;
  setActiveIdState: (id: string | null) => void;
  location: Location;
  navigate: NavigateFunction;
  entryIntentKey?: string;
  requestedSessionId: string | null;
};

export function useConversationRefs({ activeId, setActiveIdState, location, navigate, entryIntentKey, requestedSessionId }: Options) {
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const entryIntentKeyRef = useRef(entryIntentKey);
  const startedEntryIntentRef = useRef<string | null>(null);
  const freshDerivedEntryRef = useRef(Boolean(entryIntentKey && !requestedSessionId));
  const socketRef = useRef<Socket | null>(null);
  const activeConvIdRef = useRef<string | null>(activeId);
  const restoreRequestRef = useRef(0);
  const selectionRequestRef = useRef(0);
  const pendingNewSessionRef = useRef<PendingNewChat | null>(null);
  const pendingNewSessionSocketRef = useRef<Socket | null>(null);
  const queuedManualNewChatRef = useRef(false);

  useEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
    entryIntentKeyRef.current = entryIntentKey;
    freshDerivedEntryRef.current = Boolean(entryIntentKey && !requestedSessionId);
  }, [location, navigate, entryIntentKey, requestedSessionId]);

  useEffect(() => {
    const counter = selectionRequestRef;
    return () => { counter.current++; };
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    if (activeConvIdRef.current && activeConvIdRef.current !== id) {
      emittedStartChatIds.delete(activeConvIdRef.current);
    }
    activeConvIdRef.current = id;
    setActiveIdState(id);
  }, [setActiveIdState]);

  return useMemo(() => ({
    locationRef,
    navigateRef,
    entryIntentKeyRef,
    startedEntryIntentRef,
    freshDerivedEntryRef,
    socketRef,
    activeConvIdRef,
    restoreRequestRef,
    selectionRequestRef,
    pendingNewSessionRef,
    pendingNewSessionSocketRef,
    queuedManualNewChatRef,
    setActiveId,
  }), [
    locationRef, navigateRef, entryIntentKeyRef, startedEntryIntentRef,
    freshDerivedEntryRef, socketRef, activeConvIdRef, restoreRequestRef,
    selectionRequestRef, pendingNewSessionRef, pendingNewSessionSocketRef,
    queuedManualNewChatRef, setActiveId,
  ]);
}

export type ConversationRefs = ReturnType<typeof useConversationRefs>;
