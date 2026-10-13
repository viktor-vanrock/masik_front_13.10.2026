import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBenchmarksQuery } from '@/api/catalog';
import { DialoguePhase, DialogueStatus } from '@/types';
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
import { GLOBAL_FOOTER_HEIGHT, GLOBAL_HEADER_HEIGHT } from '@/consts';
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
    sendMessage,
    sendOptionMessage,
    acceptRecommendation,
    rejectRecommendation,
    skipRecommendToCreate,
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

  const showSkipRecommendations =
    activeDialogue?.phase === DialoguePhase.Recommend &&
    (activeDialogue.conversationStatus === 'active' || activeDialogue.conversationStatus === 'awaiting_choice');

  const doneMessage = t.create.recommendDone;

  const lastMessage = activeDialogue?.messages.at(-1);
  const awaitingStructuredAnswer =
    !!activeDialogue &&
    activeDialogue.status !== DialogueStatus.Done &&
    lastMessage?.role === 'assistant' &&
    !!lastMessage.structuredPrompt;

  // Create phase disabled — isCreateDone always false until backend supports it.
  const isCreateDone = false;
  const showGeneration = activeDialogue?.conversationStatus === 'generating'
    || (!!generation && generation.status !== 'none');

  const dialogueName = activeDialogue
    ? lang === 'en'
      ? activeDialogue.benchmarkNameEn
      : activeDialogue.benchmarkName
    : undefined;

  const HEADER_HEIGHT = GLOBAL_HEADER_HEIGHT + GLOBAL_FOOTER_HEIGHT;

  const restoreEntityName = activeDialogue?.benchmarkName ?? activeDialogue?.benchmarkNameEn ?? '';

  return (
    <>
      <div
        className="flex overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-page)',
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <Sidebar
          dialogues={dialogues}
          activeId={activeId}
          onNewSession={startNewSession}
          onSelectDialogue={selectDialogue}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <CreateHeader
            dialogueName={dialogueName}
            dialogueStatus={activeDialogue?.status}
            isTyping={isTyping}
            showSkipToCreate={showSkipRecommendations}
            onSkipToCreate={skipRecommendToCreate}
          />

          {connectionError && (
            <p
              className="px-4 py-2 text-xs flex-shrink-0"
              style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}
            >
              {connectionError}
            </p>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {activeDialogue?.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                benchmarks={allBenchmarks}
                onQuickReply={handleSendMessage}
                quickReplyDisabled={isTyping || activeDialogue?.conversationStatus === 'abandoned'}
                recommendationDisabled={isTyping || (
                  Boolean(activeDialogue?.conversationId) &&
                  activeDialogue?.conversationStatus !== 'active' &&
                  activeDialogue?.conversationStatus !== 'awaiting_choice'
                )}
                onOptionSelect={sendOptionMessage}
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

          <div
            className="px-4 py-4 flex-shrink-0"
            style={{
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-navbar)',
            }}
          >
            {showGeneration && (
              <p className="py-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {generation?.status === 'succeeded' ? t.create.generation.done
                  : generation?.status === 'failed' ? t.create.generation.failed
                    : generation?.status === 'cancelled' ? t.create.generation.cancelled
                      : t.create.generation.waiting}
              </p>
            )}
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
                awaitingStructuredAnswer={awaitingStructuredAnswer}
                showSkipButton={showSkipRecommendations}
                doneMessage={doneMessage}
                onSend={() => handleSendMessage()}
                onChange={setInputValue}
                onKeyDown={handleKeyDown}
                onSkip={skipRecommendToCreate}
              />
            )}
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
