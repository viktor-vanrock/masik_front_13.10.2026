import { useState, useEffect, useCallback } from 'react';
import type { Dialogue, CreateBenchmarkTestDto, SettingsAggregate } from '@/types';
import type { PublishStage } from '@/pages/BenchmarkCreate/consts';
import {
  useRestoreMyCatalogSubmissionMutation,
  useSubmitCatalogEntryMutation,
} from '@/api/catalog';
import { useSettingsAggregateQuery } from '@/api/settings';
import { formatServerErrorMessage, isSoftDeletedConflict } from '@/services/http';

const PUBLISH_DURATION_MS = 3_000;
const PUBLISH_TICK_MS = 80;

function extractInterviewDto(
  dialogue: Dialogue,
  suiteId: string,
  aggregate: SettingsAggregate | undefined,
): CreateBenchmarkTestDto {
  const msgs = dialogue.messages;

  // Collect structured answers by stepIndex
  const byStep: Record<number, string> = {};
  for (let i = 0; i < msgs.length - 1; i++) {
    const msg = msgs[i];
    if (msg.role !== 'assistant' || !msg.structuredPrompt) continue;
    const next = msgs[i + 1];
    if (next?.role !== 'user') continue;
    const stepIdx = msg.structuredPrompt.stepIndex;
    if (stepIdx !== undefined) byStep[stepIdx] = next.content.trim();
  }

  // RAG: step 3 is yes/no; map 'yes' → rag capability UUID
  const capabilityIds: string[] = [];
  if (byStep[3] === 'yes') {
    const ragCap = (aggregate?.parameters.capabilities ?? []).find(
      (c) => c.name.toLowerCase() === 'rag',
    );
    if (ragCap) capabilityIds.push(ragCap.id);
  }

  // sizeInSamples: step 6, skip '__custom__'
  let sizeInSamples: number | undefined;
  if (byStep[6] && byStep[6] !== '__custom__') {
    const n = parseInt(byStep[6], 10);
    if (!isNaN(n)) sizeInSamples = n;
  }

  // Use first user message as description
  const firstUserMsg = msgs.find((m) => m.role === 'user');
  const description = firstUserMsg?.content ?? dialogue.benchmarkName;

  const dto: CreateBenchmarkTestDto = {
    suiteId,
    name: dialogue.benchmarkName,
    nameEn: dialogue.benchmarkNameEn,
    description,
    isGenerated: true,
  };

  if (byStep[1]) dto.taskTypeId = byStep[1];
  if (byStep[2]) dto.difficultyId = byStep[2];
  if (byStep[5]) dto.languageId = byStep[5];
  if (capabilityIds.length) dto.capabilityIds = capabilityIds;
  if (sizeInSamples) dto.sizeInSamples = sizeInSamples;

  return dto;
}

export function usePublishState() {
  const [stage, setStage] = useState<PublishStage>('idle');
  const [progress, setProgress] = useState(0);
  const [publishedId, setPublishedId] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [softDeletedId, setSoftDeletedId] = useState<string | null>(null);

  const createMutation = useSubmitCatalogEntryMutation();
  const restoreMutation = useRestoreMyCatalogSubmissionMutation();
  const { data: aggregate } = useSettingsAggregateQuery();

  const reset = useCallback(() => {
    setStage('idle');
    setProgress(0);
    setPublishedId('');
    setPublishError(null);
    setSoftDeletedId(null);
  }, []);

  const triggerProducing = useCallback(() => {
    setStage((prev) => (prev === 'idle' ? 'producing' : prev));
  }, []);

  useEffect(() => {
    if (stage !== 'producing') return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startTime) / PUBLISH_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) setStage('confirm');
    }, PUBLISH_TICK_MS);

    return () => clearInterval(timer);
  }, [stage]);

  const handlePublish = useCallback(
    async (activeDialogue: Dialogue | null, suiteId: string) => {
      if (!activeDialogue || !suiteId) return;
      setPublishError(null);

      const dto = extractInterviewDto(activeDialogue, suiteId, aggregate);

      try {
        const created = await createMutation.mutateAsync({
          ...dto,
          ...(activeDialogue.conversationId
            ? { sourceConversationId: activeDialogue.conversationId }
            : {}),
        });
        setPublishedId(created.id);
        setStage('submitted');
      } catch (e) {
        if (isSoftDeletedConflict(e)) {
          setSoftDeletedId(e.payload.deletedId);
          setStage('confirm');
          return;
        }
        setPublishError(formatServerErrorMessage(e) ?? 'Ошибка при публикации');
        setStage('confirm');
      }
    },
    [createMutation, aggregate],
  );

  const clearSoftDeletedId = useCallback(() => setSoftDeletedId(null), []);

  const handleRestoreConfirm = useCallback(async () => {
    if (!softDeletedId) return;
    const restored = await restoreMutation.mutateAsync(softDeletedId);
    setPublishedId(restored.id);
    setSoftDeletedId(null);
    setStage('submitted');
  }, [restoreMutation, softDeletedId]);

  return {
    stage,
    progress,
    publishedId,
    publishError,
    softDeletedId,
    isPending: createMutation.isPending,
    isRestoring: restoreMutation.isPending,
    reset,
    triggerProducing,
    handlePublish,
    clearSoftDeletedId,
    handleRestoreConfirm,
  };
}
