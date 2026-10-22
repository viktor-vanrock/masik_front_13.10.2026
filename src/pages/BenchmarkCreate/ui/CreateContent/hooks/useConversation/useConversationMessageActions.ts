import { useCallback } from 'react';
import { WS_CLIENT_EVENTS } from '@/services/socket';
import { DialoguePhase, DialogueStatus } from '@/types';
import type { Dialogue } from '@/types';
import { createUserMessage } from '../../utils/messageFactory';
import type { ConversationRefs } from './useConversationRefs';
import type { ConversationStateSetters } from './utils/types';

type Options = {
  activeId: string | null;
  activeDialogue: Dialogue | null;
  isTyping: boolean;
  dialogues: Dialogue[];
  socketDialogues: Dialogue[];
  refs: ConversationRefs;
  setters: ConversationStateSetters;
};

export function useConversationMessageActions({
  activeId,
  activeDialogue,
  isTyping,
  dialogues,
  socketDialogues,
  refs,
  setters,
}: Options) {
  const { socketRef } = refs;
  const { setSocketDialogues, setIsTyping } = setters;

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
    [activeId, isTyping, socketDialogues, activeDialogue?.conversationStatus, setIsTyping, setSocketDialogues, socketRef],
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
    [activeId, isTyping, socketDialogues, activeDialogue?.conversationStatus, setIsTyping, setSocketDialogues, socketRef],
  );

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
    acceptRecommendation,
    rejectRecommendation,
    skipRecommendToCreate,
    startDerivedCreation,
  };
}
