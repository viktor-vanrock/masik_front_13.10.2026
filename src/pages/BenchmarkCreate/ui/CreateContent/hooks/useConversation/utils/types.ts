import type { Dispatch, SetStateAction } from 'react';
import type { Dialogue } from '@/types';
import type { DerivedIntent } from '../../../utils/derivedIntent';

export type UseConversationOptions = {
  entryIntentKey?: string;
  entryReady?: boolean;
  entryTitle?: string;
  derivedIntent?: DerivedIntent | null;
};

export type PendingNewChat = {
  entryIntentKey?: string;
  entryTitle?: string;
  derivedIntent?: DerivedIntent;
};

export type HistoryLabels = {
  recommendationResult: string;
  recommendationEmpty: string;
  recommendationFailed: string;
  recommendationRetrying: string;
  recommendationSelected: string;
  recommendationRejected: string;
};

export type ConversationStateSetters = {
  setSocketDialogues: Dispatch<SetStateAction<Dialogue[]>>;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setPendingSearchConversationId: Dispatch<SetStateAction<string | null>>;
  setConnectionError: Dispatch<SetStateAction<string | null>>;
  setEntryConversationId: Dispatch<SetStateAction<string | null>>;
  setEntryAttemptVersion: Dispatch<SetStateAction<number>>;
};
