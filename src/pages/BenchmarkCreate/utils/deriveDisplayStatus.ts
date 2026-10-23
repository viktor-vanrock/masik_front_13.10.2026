import { DisplayStatus } from '@/types';
import type { Dialogue } from '@/types';
import type { ConversationGenerationDto, ConversationProductionDto } from '@/api/conversations';

export function deriveDisplayStatus(
  dialogue: Dialogue | null,
  generation?: ConversationGenerationDto,
  production?: ConversationProductionDto,
): DisplayStatus {
  if (!dialogue) return DisplayStatus.Draft;

  if (dialogue.catalogSubmissionStatus === 'validation') {
    return DisplayStatus.Submitted;
  }

  if (production?.status === 'succeeded') {
    return DisplayStatus.Ready;
  }

  if (dialogue.messages.some((message) => message.role === 'assistant' && message.content.startsWith('MOCK_SET_READY:'))) {
    return DisplayStatus.Ready;
  }

  if (production?.status === 'queued' || production?.status === 'running') {
    return DisplayStatus.Producing;
  }

  if (generation?.status === 'succeeded') {
    return DisplayStatus.Samples;
  }

  if (
    generation?.status === 'queued' ||
    generation?.status === 'running' ||
    dialogue.conversationStatus === 'generating'
  ) {
    return DisplayStatus.Generating;
  }

  return DisplayStatus.Draft;
}
