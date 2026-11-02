import { useCallback, useEffect, useRef } from 'react';
import { WS_CLIENT_EVENTS } from '@/services/socket';
import { DialoguePhase, DialogueStatus } from '@/types';
import type { Dialogue, OutgoingChatMessage } from '@/types';
import { createUserMessage } from '../../utils/messageFactory';
import { outgoingUserMessage, saveOutgoingMessage } from '../../utils/chatOutbox';
import type { ConversationRefs } from './useConversationRefs';
import type { ConversationStateSetters } from './utils/types';

type Options = {
  userId: string | null;
  activeId: string | null;
  activeDialogue: Dialogue | null;
  isTyping: boolean;
  dialogues: Dialogue[];
  socketDialogues: Dialogue[];
  refs: ConversationRefs;
  setters: ConversationStateSetters;
};

export function useConversationMessageActions({
  userId,
  activeId,
  activeDialogue,
  isTyping,
  dialogues,
  socketDialogues,
  refs,
  setters,
}: Options) {
  const { socketRef } = refs;
  const { setSocketDialogues, setIsTyping, setConnectionError } = setters;

  const inFlight = useRef(new Set<string>());
  const deliveryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const emitOutgoing = useCallback((conversationId: string, outgoing: OutgoingChatMessage) => {
    if (!userId || inFlight.current.has(conversationId)) return;
    inFlight.current.add(conversationId);
    const socket = socketRef.current;
    const next = { ...outgoing, delivery: socket?.connected ? 'sending' as const : 'unconfirmed' as const };
    saveOutgoingMessage(userId, conversationId, next);
    setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id !== conversationId ? dialogue : {
      ...dialogue, outgoingMessage: next,
      messages: dialogue.messages.some((message) => message.id === next.requestId)
        ? dialogue.messages : [...dialogue.messages, outgoingUserMessage(next)],
      updatedAt: new Date().toISOString(), status: DialogueStatus.InProgress,
    }));
    if (!socket?.connected) return;
    setConnectionError(null);
    try {
      socket.emit(WS_CLIENT_EVENTS.SEND_MESSAGE, {
        conversationId, requestId: next.requestId, kind: next.kind, value: next.value,
        ...(next.label === undefined ? {} : { label: next.label }),
      });
    } catch {
      inFlight.current.delete(conversationId);
      setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id === conversationId
        ? { ...dialogue, outgoingMessage: { ...next, delivery: 'unconfirmed' } } : dialogue));
    }
  }, [userId, socketRef, setSocketDialogues, setConnectionError]);

  const send = useCallback((kind: 'text' | 'option', value: string, label?: string) => {
    if (!activeId || !value.trim() || isTyping || activeDialogue?.outgoingMessage
      || activeDialogue?.conversationStatus === 'abandoned') return;
    const target = socketDialogues.find((dialogue) => dialogue.id === activeId);
    if (!target?.conversationId) return;
    const message = createUserMessage(label ?? value.trim());
    emitOutgoing(target.conversationId, { requestId: message.id, kind, value: value.trim(), label,
      timestamp: message.timestamp, delivery: 'sending' });
  }, [activeId, activeDialogue?.outgoingMessage, activeDialogue?.conversationStatus, isTyping, socketDialogues, emitOutgoing]);

  const sendMessage = useCallback(async (text: string) => { send('text', text); }, [send]);
  const sendOptionMessage = useCallback((id: string, label: string) => { send('option', id, label); }, [send]);

  const retryResponse = useCallback(() => {
    if (!activeId || inFlight.current.has(activeId) || !activeDialogue || activeDialogue.conversationStatus === 'abandoned') return;
    if (activeDialogue.outgoingMessage) {
      if (activeDialogue.outgoingMessage.delivery === 'unconfirmed') emitOutgoing(activeId, activeDialogue.outgoingMessage);
      return;
    }
    const response = activeDialogue.responseState;
    if (activeDialogue.retryingResponse || response?.status !== 'failed' || !response.error?.retryable
      || activeDialogue.messages.findLast((message) => message.role === 'user')?.id !== response.userMessageId) return;
    const socket = socketRef.current;
    if (!socket?.connected) return;
    inFlight.current.add(activeId);
    setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id === activeId
      ? { ...dialogue, retryingResponse: true } : dialogue));
    setConnectionError(null);
    try {
      socket.emit(WS_CLIENT_EVENTS.RETRY_RESPONSE, { conversationId: activeId,
        userMessageId: response.userMessageId, expectedAttempt: response.attempt });
    } catch {
      inFlight.current.delete(activeId);
      setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id === activeId
        ? { ...dialogue, retryingResponse: false } : dialogue));
    }
  }, [activeId, activeDialogue, emitOutgoing, socketRef, setSocketDialogues, setConnectionError]);

  useEffect(() => {
    const waiting = socketDialogues.filter((dialogue) => dialogue.outgoingMessage?.delivery === 'sending' || dialogue.retryingResponse);
    for (const id of inFlight.current) {
      if (!waiting.some((dialogue) => dialogue.id === id)) inFlight.current.delete(id);
    }
    for (const [id, timer] of deliveryTimers.current) {
      if (waiting.some((dialogue) => dialogue.id === id)) continue;
      clearTimeout(timer);
      deliveryTimers.current.delete(id);
      inFlight.current.delete(id);
    }
    for (const captured of waiting) {
      if (deliveryTimers.current.has(captured.id)) continue;
      // A missing acknowledgement permits an explicit retry, never an automatic resend.
      deliveryTimers.current.set(captured.id, setTimeout(() => {
        deliveryTimers.current.delete(captured.id);
        inFlight.current.delete(captured.id);
        setSocketDialogues((previous) => previous.map((dialogue) => dialogue.id === captured.id
          ? { ...dialogue, retryingResponse: false,
            outgoingMessage: dialogue.outgoingMessage ? { ...dialogue.outgoingMessage, delivery: 'unconfirmed' } : null }
          : dialogue));
      }, 10_000));
    }
  }, [socketDialogues, setSocketDialogues]);
  useEffect(() => {
    const timers = deliveryTimers.current;
    return () => { for (const timer of timers.values()) clearTimeout(timer); };
  }, []);

  const acceptRecommendation = useCallback((recommendationId: string) => {
    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.SELECT_RECOMMENDATION, {
      recommendationId,
    });
  }, [setIsTyping, socketRef]);

  const rejectRecommendation = useCallback((recommendationId: string) => {
    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.REJECT_RECOMMENDATION, {
      recommendationId,
    });
  }, [setIsTyping, socketRef]);

  const skipRecommendToCreate = useCallback(() => {
    if (!activeId || isTyping) return;
    const target = dialogues.find((dialogue) => dialogue.id === activeId);
    if (!target?.conversationId || target.phase !== DialoguePhase.Recommend
      || (target.conversationStatus !== 'active' && target.conversationStatus !== 'awaiting_choice')) return;

    setIsTyping(true);
    socketRef.current?.emit(WS_CLIENT_EVENTS.START_BENCHMARK_CREATION, {
      conversationId: target.conversationId,
    });
  }, [activeId, isTyping, dialogues, setIsTyping, socketRef]);

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
  }, [activeId, isTyping, dialogues, setIsTyping, setSocketDialogues, socketRef]);

  return {
    sendMessage,
    sendOptionMessage,
    retryResponse,
    acceptRecommendation,
    rejectRecommendation,
    skipRecommendToCreate,
    startDerivedCreation,
  };
}
