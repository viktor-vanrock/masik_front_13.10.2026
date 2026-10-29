import type { ConversationStatus, RecommendationStatus } from '@/types';

export type MessageRole = 'user' | 'agent';
export type MessageKind =
  | 'text'
  | 'question'
  | 'option'
  | 'result'
  | 'hypotheses'
  | 'error'
  | 'recommendation_selected'
  | 'recommendation_rejected';

export interface MessageDto {
  id: string;
  role: MessageRole;
  kind: MessageKind;
  content: string;
  options: Array<{ id: string; label: string }> | {
    kind: 'recommendations';
    benchmarks: Array<{ testId: string; explanation?: string }>;
  } | null;
  createdAt: string;
}

export interface RecommendationDto {
  id: string;
  conversationId: string;
  testId: string;
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResultItemDto {
  testId: string;
  rank: number;
  score: number;
  rerankScore?: number | null;
  explanation?: string;
  sourceUpdatedAt: string;
}

export interface RecommendationRequestDto {
  id: string;
  conversationId: string;
  query: string;
  topK: number;
  status: 'pending' | 'completed' | 'failed';
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  retrievalVersion: string | null;
  rerankerVersion: string | null;
  retrievalDurationMs: number | null;
  resultPayload: RecommendationResultItemDto[] | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryable: boolean | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDto {
  id: string;
  status: ConversationStatus;
  intent?: 'find_existing' | 'create_new' | null;
  title?: string | null;
  isArchived?: boolean;
  pinnedDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSubmissionDto {
  id: string;
  status: 'validation' | 'published' | 'rejected';
  submittedAt: string;
}

export interface ConversationDetailDto extends ConversationDto {
  messages: MessageDto[];
  recommendations: RecommendationDto[];
  recommendationRequests: RecommendationRequestDto[];
  catalogSubmission?: CatalogSubmissionDto | null;
}

export type ConversationsListRaw =
  | ConversationDto[]
  | { data: ConversationDto[]; total: number; page?: number; limit?: number };

export interface ConversationSidebarPage {
  /** Pinned and archived lists are returned on the first page only. */
  pinned: ConversationDto[];
  data: ConversationDto[];
  total: number;
  pageSize: number;
  archived: ConversationDto[];
}

export interface ConversationGenerationDto {
  jobId: string | null;
  status: 'none' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: {
    phase: string | null;
    completedGenerations: number;
    totalGenerations: number | null;
    completedMutations?: number;
    totalMutations?: number | null;
    completedLlmCalls?: number;
    totalLlmCalls?: number | null;
    estimatedCompletionAt?: string | null;
  };
  examples: Array<Record<string, unknown>>;
  error: { code: string; message?: string } | null;
}

export interface ConversationProductionDto {
  jobId: string | null;
  status: 'none' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  requestedCount: number | null;
  selectedIndices?: number[] | null;
  generatedCount: number;
  examples: Array<Record<string, unknown>>;
  error: { code: string; message?: string } | null;
}
