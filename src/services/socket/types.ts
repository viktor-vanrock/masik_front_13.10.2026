export interface StartChatPayload {
  conversationId?: string;
}

export interface SendMessagePayload {
  conversationId: string;
  kind: 'text' | 'option';
  value: string;
  label?: string;
}

export interface RecommendationActionPayload {
  recommendationId: string;
}

export interface RegenerateHypothesesPayload {
  conversationId: string;
}

export interface AgentQuestionContent {
  kind: 'question';
  label: string;
  options: Array<{ id: string; label: string }> | null;
}

export interface AgentTextContent {
  kind: 'text';
  label: string;
}

export interface AgentResultContent {
  kind: 'result';
  label: string;
  testId?: string;
  status: 'finished' | 'done' | 'generating';
  generationJobId?: string;
}

export interface AgentHypothesesContent {
  kind: 'hypotheses';
  testId: string;
  hypotheses: string[];
}

export interface AgentErrorContent {
  message: string;
}

export type AgentMessagePayload = { conversationId?: string } & (
  | { type: 'message'; isFinal: false; content: AgentTextContent; id: string }
  | { type: 'question'; isFinal: boolean; content: AgentQuestionContent; id: string }
  | { type: 'result'; isFinal: boolean; content: AgentResultContent; id: string }
  | { type: 'hypotheses'; isFinal: boolean; content: AgentHypothesesContent; id: string }
  | { type: 'error'; isFinal: boolean; content: AgentErrorContent }
);

export interface ChatStartedPayload {
  conversationId: string;
}

export interface RecommendationUpdatedPayload {
  id: string;
  conversationId: string;
  testId: string;
  status: 'pending' | 'selected' | 'rejected';
  createdAt: string;
  updatedAt: string;
}


export interface WsErrorPayload {
  message: string;
}

export interface WsExceptionPayload {
  status: string;
  message: string;
}

export interface RequestRecommendationsPayload {
  conversationId: string;

  // Только человеческое описание задачи.
  // Никаких embeddings и ML-параметров на frontend нет.
  query: string;
}

export interface RecommendationRequestAcceptedPayload {
  requestId: string;
  conversationId: string;
  status: 'pending';

  // Date после передачи через Socket.IO становится ISO-строкой.
  createdAt: string;
}

export interface BenchmarkCreationStartedPayload {
  conversationId: string;
}

export type RecommendationResultPayload =
  | {
      status: 'retrying';
      requestId: string;
      conversationId: string;
      errorCode: string;
      attemptCount: number;
      maxAttempts: number;
      nextRetryAt: string;
    }
  | {
      status: 'completed';
      requestId: string;
      conversationId: string;
      retrievalVersion: string;
      label?: string;
      recommendations: RecommendationUpdatedPayload[];
      explanations?: { testId: string; explanation?: string }[];
    }
  | {
      status: 'failed';
      requestId: string;
      conversationId: string;
      errorCode: string;
      message: string;
      retryable: boolean;
    };
