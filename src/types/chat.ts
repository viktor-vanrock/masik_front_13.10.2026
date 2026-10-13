export const DialogueStatus = {
  Interview: 'interview',
  InProgress: 'in-progress',
  Done: 'done',
} as const;
export type DialogueStatus = typeof DialogueStatus[keyof typeof DialogueStatus];

export const DialoguePhase = {
  Recommend: 'recommend',
  Create: 'create',
} as const;
export type DialoguePhase = typeof DialoguePhase[keyof typeof DialoguePhase];

export const DialogueCompletionKind = {
  Recommend: 'recommend',
  Create: 'create',
} as const;
export type DialogueCompletionKind = typeof DialogueCompletionKind[keyof typeof DialogueCompletionKind];

export type StructuredPromptKind = 'single' | 'boolean' | 'chips';

export interface StructuredPromptOption {
  value: string;
  label: string;
}

export interface StructuredPrompt {
  kind: StructuredPromptKind;
  options: StructuredPromptOption[];
  stepIndex?: number;
}

export type ConversationStatus = 'active' | 'awaiting_choice' | 'generating' | 'completed' | 'abandoned';
export type RecommendationStatus = 'pending' | 'selected' | 'rejected';

export interface AgentOption {
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: string[];
  recommendationItems?: Array<{
    testId: string;
    id: string;
    status: RecommendationStatus;
  }>;
  quickReplies?: string[];
  structuredPrompt?: StructuredPrompt;
  /** Backend-originated options from agent question (socket mode). */
  agentOptions?: AgentOption[];
  /** Set after REST hydration when this message is a result-type recommendation. */
  pendingRecommendationId?: string;
  /** Updated by recommendation_updated socket event. */
  recommendationStatus?: RecommendationStatus;
}

export interface Dialogue {
  id: string;
  benchmarkName: string;
  benchmarkNameEn: string;
  startedAt: string;
  updatedAt: string;
  status: DialogueStatus;
  messages: ChatMessage[];
  phase: DialoguePhase;
  nextInterviewIndex?: number;
  completionKind?: DialogueCompletionKind;
  /** Present when this dialogue is backed by a real backend conversation. */
  conversationId?: string;
  /** Reflects the backend conversation status (socket mode only). */
  conversationStatus?: ConversationStatus;
}
