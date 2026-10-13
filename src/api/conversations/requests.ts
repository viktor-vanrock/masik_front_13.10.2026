import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import type {
  ConversationDto,
  ConversationDetailDto,
  ConversationsListRaw,
  ConversationGenerationDto,
  ConversationProductionDto,
} from './types';

export async function listConversations(): Promise<ConversationDto[]> {
  const { data } = await httpClient.get<ConversationsListRaw>(
    BACKEND_PATHS.conversations.list,
  );
  return Array.isArray(data) ? data : data.data;
}

export async function getConversation(id: string): Promise<ConversationDetailDto> {
  const { data } = await httpClient.get<ConversationDetailDto>(
    BACKEND_PATHS.conversations.detail(id),
  );
  return data;
}

export async function getConversationGeneration(id: string): Promise<ConversationGenerationDto> {
  const { data } = await httpClient.get<ConversationGenerationDto>(
    BACKEND_PATHS.conversations.generation(id),
  );
  return data;
}

export async function retryConversationGeneration(id: string): Promise<ConversationGenerationDto> {
  const { data } = await httpClient.post<ConversationGenerationDto>(
    BACKEND_PATHS.conversations.retryGeneration(id),
  );
  return data;
}

export async function cancelConversationGeneration(id: string, jobId: string): Promise<ConversationGenerationDto> {
  const { data } = await httpClient.post<ConversationGenerationDto>(
    BACKEND_PATHS.conversations.cancelGeneration(id, jobId),
  );
  return data;
}

export async function getConversationProduction(id: string): Promise<ConversationProductionDto> {
  const { data } = await httpClient.get<ConversationProductionDto>(
    BACKEND_PATHS.conversations.production(id),
  );
  return data;
}

export async function startConversationProduction(
  id: string, numTasks: number, creatorJobId: string, selectedIndices: number[],
): Promise<ConversationProductionDto> {
  const { data } = await httpClient.post<ConversationProductionDto>(
    BACKEND_PATHS.conversations.production(id),
    { numTasks, creatorJobId, selectedIndices },
  );
  return data;
}
