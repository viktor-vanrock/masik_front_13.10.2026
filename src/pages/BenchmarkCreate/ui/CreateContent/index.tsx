import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBenchmarksQuery } from '@/api/catalog';
import { DialogueStatus } from '@/types';
import { deriveDisplayStatus } from '../../utils/deriveDisplayStatus';
import { useApp } from '@/hooks/useApp';
import { usePublishState } from './hooks/usePublishState';
import { useConversation } from './hooks/useConversation';
import { CreateHeader } from '../CreateHeader';
import { MessageBubble } from '../MessageBubble';
import { TypingIndicator } from '@components/ui';
import { PublishState } from '../PublishState';
import { MessageInput } from '../MessageInput';
import { GenerationPanel } from '../GenerationPanel';
import { Sidebar } from '../Sidebar';
import { RestoreModal } from '@ui/RestoreModal';

export const CreateContent = () => {
  const { lang, t } = useApp();

  /**
   * Recommendation events contain canonical BenchmarkTest IDs from backend.
   * The legacy BenchmarksContext contains mock IDs and cannot hydrate them.
   */
  const { data: benchmarksResponse } = useBenchmarksQuery({ limit: 1000 });
  const allBenchmarks = benchmarksResponse?.data ?? [];

  const [inputValue, setInputValue] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    stage: publishStage,
    progress: publishProgress,
    publishedId,
    publishError,
    softDeletedId,
    isPending: isPublishing,
    isRestoring,
    reset: resetPublish,
    handlePublish,
    clearSoftDeletedId,
    handleRestoreConfirm,
  } = usePublishState();

  const {
    dialogues,
    activeId,
    activeDialogue,
    isTyping,
    connectionError,
    selectDialogue,
    startNewSession,
    renameDialogue,
    toggleArchive,
    sendMessage,
    acceptRecommendation,
    rejectRecommendation,
    generation,
    generationError,
    retryGeneration,
    refreshGeneration,
    isRetryingGeneration,
    retryGenerationError,
    cancelGeneration,
    isCancellingGeneration,
    cancelGenerationError,
    production,
    productionLoading,
    productionError,
    refreshProduction,
    startProduction,
    isStartingProduction,
    startProductionError,
  } = useConversation();

  const archivedDialogueIds = dialogues.filter((dialogue) => dialogue.isArchived).map((dialogue) => dialogue.id);

  // resetPublish is stable (useCallback([])) — intentionally omitted from deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetPublish(); }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDialogue?.messages, isTyping, generation?.status, generation?.examples.length]);

  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
      const text = textOverride ?? inputValue;
      if (!text.trim()) return;
      if (textOverride === undefined) setInputValue('');
      await sendMessage(text);
    },
    [inputValue, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const doneMessage = t.create.recommendDone;

  // Create phase disabled — isCreateDone always false until backend supports it.
  const isCreateDone = false;
  const showGeneration = activeDialogue?.conversationStatus === 'generating'
    || (!!generation && generation.status !== 'none');

  const dialogueName = activeDialogue
    ? lang === 'en'
      ? activeDialogue.benchmarkNameEn
      : activeDialogue.benchmarkName
    : undefined;
  const displayStatus = deriveDisplayStatus(activeDialogue, generation, production);
  const restoreEntityName = activeDialogue?.benchmarkName ?? activeDialogue?.benchmarkNameEn ?? '';

  return (
    <>
      <div
        className="relative w-full max-w-[1440px] mx-auto flex overflow-hidden max-[600px]:[--benchmark-create-header-height:68px] max-[600px]:[--benchmark-create-footer-height:125px] max-[860px]:[--benchmark-create-header-height:68px]"
        style={{
          height: 'calc(100dvh - var(--benchmark-create-header-height, 80px) - var(--benchmark-create-footer-height, 89px))',
          backgroundColor: 'var(--bg-page)',
        }}
      >
        <Sidebar
          dialogues={dialogues}
          activeId={activeId}
          onNewSession={() => { startNewSession(); setMobileSidebarOpen(false); }}
          onSelectDialogue={selectDialogue}
          archivedIds={archivedDialogueIds}
          deriveDisplayStatus={(d) => deriveDisplayStatus(
            d,
            d.id === activeId ? generation : undefined,
            d.id === activeId ? production : undefined,
          )}
          mobileOpen={mobileSidebarOpen}
          onToggleMobile={() => setMobileSidebarOpen((open) => !open)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0" onClick={() => setMobileSidebarOpen(false)}>
          <CreateHeader
            dialogueName={dialogueName}
            displayStatus={displayStatus}
            isTyping={isTyping}
            onRename={(name) => activeId && renameDialogue(activeId, name)}
            onArchive={() => { if (activeId) void toggleArchive(activeId); }}
            isArchived={activeDialogue?.isArchived ?? false}
          />

          {connectionError && (
            <p
              className="px-4 py-2 text-xs flex-shrink-0"
              style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}
            >
              {connectionError}
            </p>
          )}

          <div className="flex-1 overflow-y-auto px-4 pt-7 pb-3">
            <div className="flex flex-col gap-6 pb-6 w-full max-w-[760px] mx-auto">
              {activeDialogue?.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  benchmarks={allBenchmarks}
                  recommendationDisabled={isTyping || (
                    Boolean(activeDialogue?.conversationId) &&
                    activeDialogue?.conversationStatus !== 'active' &&
                    activeDialogue?.conversationStatus !== 'awaiting_choice'
                  )}
                  onAcceptRecommendation={acceptRecommendation}
                  onRejectRecommendation={rejectRecommendation}
                />
              ))}
              {isTyping && <TypingIndicator />}
              {showGeneration && <GenerationPanel
                key={activeId}
                generation={generation}
                loadError={generationError}
                retryError={retryGenerationError}
                isRetrying={isRetryingGeneration}
                onRetry={retryGeneration}
                onRefresh={refreshGeneration}
                onCancel={cancelGeneration}
                isCancelling={isCancellingGeneration}
                cancelError={cancelGenerationError}
                production={production}
                productionLoading={productionLoading}
                productionError={productionError}
                onProductionRefresh={refreshProduction}
                onStartProduction={startProduction}
                isStartingProduction={isStartingProduction}
                startProductionError={startProductionError}
              />}
              <div ref={bottomRef} />
            </div>
          </div>

          <div
            className="w-full px-4 py-3 flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-page)' }}
          >
            {showGeneration && (
              <p className="py-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {generation?.status === 'succeeded' ? t.create.generation.done
                  : generation?.status === 'failed' ? t.create.generation.failed
                    : generation?.status === 'cancelled' ? t.create.generation.cancelled
                      : t.create.generation.waiting}
              </p>
            )}
            <div className="w-full max-w-[760px] mx-auto">
              {isCreateDone ? (
                <PublishState
                  stage={publishStage}
                  progress={publishProgress}
                  publishedId={publishedId}
                  isPending={isPublishing}
                  publishError={publishError}
                  onPublish={(suiteId) => handlePublish(activeDialogue, suiteId)}
                />
              ) : (
                <MessageInput
                  inputValue={inputValue}
                  isTyping={isTyping}
                  status={activeDialogue?.conversationId && activeDialogue.conversationStatus !== 'abandoned'
                    ? DialogueStatus.InProgress : activeDialogue?.status}
                  completionKind={activeDialogue?.completionKind}
                  doneMessage={doneMessage}
                  onSend={() => handleSendMessage()}
                  onChange={setInputValue}
                  onKeyDown={handleKeyDown}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {softDeletedId && (
        <RestoreModal
          entityName={restoreEntityName}
          isPending={isRestoring}
          onClose={clearSoftDeletedId}
          onConfirm={handleRestoreConfirm}
        />
      )}
    </>
  );
};
