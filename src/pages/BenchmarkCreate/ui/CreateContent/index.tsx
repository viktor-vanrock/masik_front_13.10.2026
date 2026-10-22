import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBenchmarkQuery, useBenchmarksQuery, useSuiteQuery } from '@/api/catalog';
import { DialoguePhase, DialogueStatus } from '@/types';
import { deriveDisplayStatus } from '../../utils/deriveDisplayStatus';
import { useApp } from '@/hooks/useApp';
import { usePublishState } from './hooks/usePublishState';
import { useConversation } from './hooks/useConversation/useConversation';
import { loadDerivedIntent, type DerivedIntent } from './utils/derivedIntent';
import { CreateHeader } from '../CreateHeader';
import { MessageBubble } from '../MessageBubble';
import { TypingIndicator } from '@components/ui';
import { PublishState } from '../PublishState';
import { MessageInput } from '../MessageInput';
import { GenerationPanel } from '../GenerationPanel';
import { Sidebar } from '../Sidebar';
import { RestoreModal } from '@ui/RestoreModal';
import { buildDerivedRequest } from './utils/buildDerivedRequest';
import { DemoGenerationLoader } from '../DemoGenerationLoader';
import type { DerivedMode, MockExample } from './types';
import { readMockExamples, readMockReady } from './mock';

export const CreateContent = () => {
  const { lang, t, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const savedIntent = loadDerivedIntent(user?.id, params.get('session'));
  const requestedMode = params.get('mode') ?? savedIntent?.mode;
  const derivedMode: DerivedMode | null = requestedMode === 'modify' || requestedMode === 'russify' ? requestedMode : null;
  const baseId = params.get('base') ?? savedIntent?.baseId ?? null;
  const baseType = params.get('baseType') ?? savedIntent?.baseType ?? null;
  const resolvedBaseType: DerivedIntent['baseType'] | null =
    baseType === 'suite' || baseType === 'test' ? baseType : null;
  const derivedEntry = Boolean(derivedMode && baseId);
  const detectBaseType = baseType !== 'suite' && baseType !== 'test';
  const entryIntentKey = derivedEntry ? `${derivedMode}:${baseType || 'auto'}:${baseId}:${params.get('new') || ''}` : undefined;
  const { data: sourceSuite, isPending: isSuitePending, isError: isSuiteError, refetch: refetchSuite } = useSuiteQuery({ id: baseId || undefined, enabled: derivedEntry && (baseType === 'suite' || detectBaseType) });
  const { data: sourceTest, isPending: isTestPending, isError: isTestError, refetch: refetchTest } = useBenchmarkQuery({ id: baseId || undefined, enabled: derivedEntry && (baseType === 'test' || (detectBaseType && isSuiteError)) });
  const isSuiteSource = baseType === 'suite' || (detectBaseType && Boolean(sourceSuite));
  const { data: sourceTestList, isPending: isTestsPending, isError: isTestsError, isPlaceholderData: isTestsPlaceholder, refetch: refetchTests } = useBenchmarksQuery(
    { suiteIds: baseId && isSuiteSource ? [baseId] : undefined, limit: 1000 },
    { enabled: derivedEntry && isSuiteSource && Boolean(sourceSuite) },
  );
  const source = isSuiteSource ? sourceSuite : sourceTest;
  const sourceTests = useMemo(() => isSuiteSource
    ? sourceTestList?.data ?? []
    : sourceTest ? [sourceTest] : [], [isSuiteSource, sourceTestList?.data, sourceTest]);
  const sourceLoading = derivedEntry && (isSuiteSource ? isSuitePending || (Boolean(sourceSuite) && (isTestsPending || isTestsPlaceholder)) : isTestPending);
  const sourceError = derivedEntry && (isSuiteSource ? isSuiteError || isTestsError : isTestError);
  const sourceReady = !derivedEntry || Boolean(source && !sourceLoading && !sourceError);
  const entryTitle = derivedEntry && source ? source.name: undefined;
  const entryDerivedIntent = useMemo<DerivedIntent | null>(() =>
    derivedEntry && resolvedBaseType && derivedMode && baseId
      ? { mode: derivedMode, baseId, baseType: resolvedBaseType } : null,
  [derivedEntry, resolvedBaseType, derivedMode, baseId]);

  const { data: benchmarksResponse } = useBenchmarksQuery({ limit: 1000 });
  const allBenchmarks = benchmarksResponse?.data ?? [];

  const [inputValue, setInputValue] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState<{ conversationId: string; startedAt: number } | null>(null);
  const [mockProductionLoading, setMockProductionLoading] = useState<{ conversationId: string; startedAt: number } | null>(null);
  const [mockExampleSelection, setMockExampleSelection] = useState<{ messageId: string; examples: MockExample[] } | null>(null);
  const [mockReadyPreviewOpen, setMockReadyPreviewOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!demoLoading) return;
    const timeout = window.setTimeout(() => setDemoLoading((current) =>
      current?.startedAt === demoLoading.startedAt ? null : current,
    ), 3000);
    return () => window.clearTimeout(timeout);
  }, [demoLoading]);

  useEffect(() => {
    if (!mockProductionLoading) return;
    const timeout = window.setTimeout(() => setMockProductionLoading((current) =>
      current?.startedAt === mockProductionLoading.startedAt ? null : current,
    ), 15000);
    return () => window.clearTimeout(timeout);
  }, [mockProductionLoading]);

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
    dialogues, activeId, activeDialogue, entryConversationId, isTyping, connectionError, startNewSession, retryEntrySession,
    startDerivedCreation, renameDialogue, toggleArchive, sendMessage, acceptRecommendation, rejectRecommendation, generation,
    generationError, retryGeneration, refreshGeneration, isRetryingGeneration, retryGenerationError, cancelGeneration,
    isCancellingGeneration, cancelGenerationError, production, productionLoading, productionError, refreshProduction,
    startProduction, isStartingProduction, startProductionError,
  } = useConversation({
    entryIntentKey,
    entryReady: sourceReady,
    entryTitle,
    derivedIntent: entryDerivedIntent,
  });

  const archivedDialogueIds = dialogues.filter((dialogue) => dialogue.isArchived).map((dialogue) => dialogue.id);

  useEffect(() => { resetPublish(); }, [activeId, resetPublish]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDialogue?.messages, isTyping, generation?.status, generation?.examples.length]);

  const handleSendMessage = useCallback(
    async (textOverride?: string) => {
      const text = textOverride ?? inputValue;
      if (!text.trim() || !activeId || isTyping || demoLoading?.conversationId === activeId || mockProductionLoading?.conversationId === activeId || (derivedEntry && (!sourceReady || activeId !== entryConversationId))) return;
      const isFirstDerivedMessage = derivedEntry && derivedMode && source
        && !activeDialogue?.messages.some((message) => message.role === 'user' && message.content.includes(`ID исходного бенчмарка: ${baseId}`));
      const message = isFirstDerivedMessage
        ? buildDerivedRequest(derivedMode, source, sourceTests, text.trim())
        : text;
      if (textOverride === undefined) setInputValue('');
      await sendMessage(message);
    },
    [activeDialogue?.messages, activeId, baseId, demoLoading?.conversationId, derivedEntry, derivedMode, entryConversationId, inputValue, isTyping, mockProductionLoading?.conversationId, sendMessage, source, sourceReady, sourceTests],
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
  const hasDerivedRequest = Boolean(baseId && activeDialogue?.messages.some((message) =>
    message.role === 'user' && message.content.includes(`ID исходного бенчмарка: ${baseId}`),
  ));
  const messages = activeDialogue?.messages ?? [];
  const mockReadyMessage = [...messages].reverse().find((message) => message.role === 'assistant' && readMockReady(message.content));
  const mockReady = mockReadyMessage ? readMockReady(mockReadyMessage.content) : null;
  const latestMockExamplesMessage = [...messages].reverse().find((message) => message.role === 'assistant' && readMockExamples(message.content));
  const mockExamples = latestMockExamplesMessage ? readMockExamples(latestMockExamplesMessage.content) : null;
  const selectedMockExamples = latestMockExamplesMessage && mockExamples
    ? mockExampleSelection?.messageId === latestMockExamplesMessage.id ? mockExampleSelection.examples : mockExamples
    : null;
  const chosenMockExamples = selectedMockExamples?.filter((example) => example.accepted) ?? [];
  const mockExamplesValid = chosenMockExamples.length > 0 &&
    chosenMockExamples.every((example) => example.input.trim() && example.expectedOutput.trim()) &&
    new Set(chosenMockExamples.map((example) => example.input.trim())).size === chosenMockExamples.length;
  const derivedRequestIndex = derivedEntry ? messages.findIndex((message) =>
    message.role === 'user' && message.content.includes(`ID исходного бенчмарка: ${baseId}`),
  ) : -1;
  const visibleMessages = derivedEntry
    ? messages.slice(derivedRequestIndex < 0 ? messages.length : derivedRequestIndex)
    : messages;
  const lastUserMessageIndex = messages.findLastIndex((message) => message.role === 'user');
  const showMockExamples = Boolean(derivedEntry && latestMockExamplesMessage && selectedMockExamples &&
    messages.indexOf(latestMockExamplesMessage) > lastUserMessageIndex);
  const hasAgentSummary = Boolean(derivedEntry && hasDerivedRequest &&
    messages.slice(lastUserMessageIndex + 1).some((message) =>
      message.role === 'assistant' && message.content.includes('Всё готово к подтверждению')));
  const showSourceStatus = derivedEntry && (sourceLoading || sourceError || !source || !entryConversationId);
  const showDemoLoading = demoLoading?.conversationId === activeId && !showGeneration;
  const showMockProductionLoading = mockProductionLoading?.conversationId === activeId && !showGeneration;
  const displayedMessages = showDemoLoading
    ? visibleMessages.filter((message) =>
      message.role !== 'assistant' ||
      (!message.content.includes('Всё готово к подтверждению') && Date.parse(message.timestamp) <= demoLoading.startedAt))
    : visibleMessages;
  const readableMessages = displayedMessages.filter((message) =>
    !readMockExamples(message.content) && !readMockReady(message.content) &&
    (!showMockProductionLoading || message.role !== 'assistant' || Date.parse(message.timestamp) <= mockProductionLoading.startedAt));

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
          onNewSession={() => { startNewSession(); if (derivedEntry) navigate('/create', { replace: true }); setMobileSidebarOpen(false); }}
          onSelectDialogue={(id) => {
            const intent = loadDerivedIntent(user?.id, id);
            const next = new URLSearchParams({ session: id });
            if (intent) {
              next.set('mode', intent.mode);
              next.set('base', intent.baseId);
              next.set('baseType', intent.baseType);
            }
            navigate(`/create?${next.toString()}`, { replace: true });
          }}
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
              {showSourceStatus && <section className="rounded-[18px] border border-[#e9edf2] bg-white p-5 text-[#1e1e20]">
                {sourceLoading ? <p className="text-[13px] text-[#686e78]">Загружаем исходный бенчмарк…</p>
                  : sourceError || !source ? <div><p className="text-[13px] text-[#686e78]">Не удалось загрузить исходный бенчмарк.</p><button type="button" onClick={() => { if (isSuiteSource) { void refetchSuite(); void refetchTests(); } else { if (detectBaseType) void refetchSuite(); void refetchTest(); } }} className="mt-3 cursor-pointer rounded-[30px] bg-[#515dad1a] px-4 py-2 text-[12px] text-[#515dad]">Повторить</button></div>
                    : <p className="text-[13px] text-[#686e78]">{connectionError ? 'Чат не открылся. Повторите подключение.' : 'Открываем новый чат…'}{connectionError && <button type="button" onClick={derivedEntry ? retryEntrySession : startNewSession} className="ml-2 cursor-pointer text-[#515dad] underline">Повторить</button>}</p>}
              </section>}
              {derivedEntry && sourceReady && activeId === entryConversationId && (
                <div className="w-full self-start rounded-[20px] bg-[#f3f6fa] px-7 py-6 text-[13px] leading-[1.8] text-[#1e1e20]">
                  <p className="m-0 font-semibold">{derivedMode === 'russify'
                    ? `Что нужно изменить при адаптации бенчмарка «${source?.name}» на русский язык?`
                    : `Что нужно изменить в бенчмарке «${source?.name}»?`}</p>
                  <p className="mb-0 mt-2 text-[13px] leading-[1.6] text-[#1e1e20]">Опишите, что улучшить, добавить или скорректировать. Остальные параметры уже загружены из исходного набора.</p>
                </div>
              )}
              {readableMessages.map((msg) => (
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
                  onConfirmGeneration={hasAgentSummary && !isTyping && !showDemoLoading && activeDialogue?.conversationStatus !== 'generating' && msg === messages.findLast((message) => message.role === 'assistant' && message.content.includes('Всё готово к подтверждению'))
                    ? () => {
                      const confirmation = 'Требования подтверждаю. Начни генерацию бенчмарка по согласованной сводке.';
                      if (!activeId) return;
                      if (activeDialogue?.phase === DialoguePhase.Recommend) {
                        if (startDerivedCreation(confirmation)) setDemoLoading({ conversationId: activeId, startedAt: Date.now() });
                      } else {
                        void sendMessage(confirmation);
                        setDemoLoading({ conversationId: activeId, startedAt: Date.now() });
                      }
                    }
                    : undefined}
                />
              ))}
              {showDemoLoading && <DemoGenerationLoader startedAt={demoLoading.startedAt} />}
              {showMockExamples && !showDemoLoading && !showMockProductionLoading && !showGeneration && selectedMockExamples && latestMockExamplesMessage && <section className="w-full max-w-[88%] rounded-[20px] bg-[#f3f6fa] px-[22px] py-[18px] text-[#1e1e20] max-[600px]:max-w-full">
                <h2 className="text-[20px] font-medium">Выберите примеры для продолжения</h2>
                <p className="mt-2 text-[12px] leading-[1.6] text-[#686e78]">Снимите галочки с ненужных примеров. Чтобы получить другие варианты, просто напишите в чат, что изменить.</p>
                <div className="mt-5 space-y-4">{selectedMockExamples.map((example, index) => <article key={index} className="rounded-[16px] border border-[#e9edf2] bg-white p-[22px]">
                  <div className="mb-5 flex items-center justify-between gap-3"><strong className="text-[13px] font-medium">Пример {index + 1}</strong><span className={`rounded-md px-2 py-1 text-[11px] ${example.accepted ? 'bg-[#e5f4ee] text-[#0c7055]' : 'bg-[#f3f6fa] text-[#686e78]'}`}>{example.accepted ? 'Выбран' : 'Не выбран'}</span></div>
                  <label className="mb-4 block text-[12px]">Задание<textarea value={example.input} onChange={(event) => setMockExampleSelection({ messageId: latestMockExamplesMessage.id, examples: selectedMockExamples.map((item, itemIndex) => itemIndex === index ? { ...item, input: event.target.value } : item) })} className="mt-2 min-h-24 w-full rounded-[10px] border border-[#d1d7de] bg-white p-3 text-[12px] leading-[1.8] outline-none focus:border-[#515dad]" /></label>
                  <label className="block text-[12px]">Эталонный ответ<textarea value={example.expectedOutput} onChange={(event) => setMockExampleSelection({ messageId: latestMockExamplesMessage.id, examples: selectedMockExamples.map((item, itemIndex) => itemIndex === index ? { ...item, expectedOutput: event.target.value } : item) })} className="mt-2 min-h-20 w-full rounded-[10px] border border-[#d1d7de] bg-white p-3 text-[12px] leading-[1.8] outline-none focus:border-[#515dad]" /></label>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-[11px] text-[#686e78]"><input type="checkbox" checked={example.accepted} onChange={(event) => setMockExampleSelection({ messageId: latestMockExamplesMessage.id, examples: selectedMockExamples.map((item, itemIndex) => itemIndex === index ? { ...item, accepted: event.target.checked } : item) })} className="h-[15px] w-[15px] shrink-0 cursor-pointer accent-[#515dad]" />Включить этот пример в набор</label>
                </article>)}</div>
                <div className="mt-6 flex flex-col items-start gap-3"><span className="text-[11px] text-[#686e78]">Выбрано: {chosenMockExamples.length} из {selectedMockExamples.length}</span><button type="button" disabled={!mockExamplesValid || isTyping} onClick={() => { if (!activeId) return; void sendMessage(`Масштабировать выбранные примеры: ${JSON.stringify(chosenMockExamples)}`); setMockProductionLoading({ conversationId: activeId, startedAt: Date.now() }); }} className="inline-flex items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad] px-5 py-3 text-[12px] font-medium text-white transition hover:bg-[#465195] disabled:cursor-not-allowed disabled:opacity-50">Масштабировать выбранные ({chosenMockExamples.length})<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"><path d="m3 9 4 4 8-9" /></svg></button>{chosenMockExamples.length > 0 && !mockExamplesValid && <p className="text-[11px] text-[#ac3636]">Заполните задания и эталонные ответы; задания не должны повторяться.</p>}</div>
              </section>}
              {showMockProductionLoading && <DemoGenerationLoader startedAt={mockProductionLoading.startedAt} producing />}
              {derivedEntry && mockReady && !showMockProductionLoading && <section className="w-full max-w-[88%] rounded-[20px] bg-[#f3f6fa] px-[22px] py-[18px] text-[#1e1e20] max-[600px]:max-w-full">
                <h2 className="text-[22px] font-medium">Ваш набор готов</h2>
                <p className="mt-3 text-[13px] leading-[1.7]">«{mockReady.name}» создан на основе {mockReady.examples.length} {mockReady.examples.length === 1 ? 'выбранного примера' : 'выбранных примеров'} и добавлен в общий каталог.</p>
                <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => {
                  const blob = new Blob([JSON.stringify({ name: mockReady.name, sourceId: mockReady.sourceId, examples: mockReady.examples }, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a'); link.href = url; link.download = `${mockReady.name}.json`; link.click();
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                }} className="inline-flex items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad] px-5 py-3 text-[13px] text-white hover:bg-[#465195]">Скачать<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M9 2v9m-4-4 4 4 4-4M3 12v3h12v-3" /></svg></button><button type="button" onClick={() => setMockReadyPreviewOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad1a] px-5 py-3 text-[13px] text-[#515dad] shadow-none hover:bg-[#515dad26]">Посмотреть<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button></div>
                {mockReadyPreviewOpen && <div className="mt-6 space-y-3 border-t border-[#e9edf2] pt-5"><h3 className="text-[16px] font-medium">Примеры набора</h3>{mockReady.examples.map((example, index) => <article key={index} className="rounded-[12px] border border-[#e9edf2] bg-white p-4 text-[12px]"><strong>Пример {index + 1}</strong><p className="mt-2 whitespace-pre-wrap">{example.input}</p><p className="mt-3 whitespace-pre-wrap text-[#686e78]">Эталонный ответ: {example.expectedOutput}</p></article>)}</div>}
              </section>}
              {isTyping && !showDemoLoading && !showMockProductionLoading && <TypingIndicator />}
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
                  disabled={Boolean(showDemoLoading || showMockProductionLoading || (derivedEntry && (!sourceReady || !activeId || activeId !== entryConversationId)))}
                  placeholder={derivedEntry && hasAgentSummary ? 'Например: «Измени язык» или «Ок»' : derivedEntry && !hasDerivedRequest ? (derivedMode === 'russify' ? 'Опишите особенности русской адаптации…' : 'Опишите, что улучшить…') : undefined}
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
