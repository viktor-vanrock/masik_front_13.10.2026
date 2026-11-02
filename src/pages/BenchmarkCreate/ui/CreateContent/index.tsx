import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBenchmarkQuery, useBenchmarksQuery, useSuiteQuery } from '@/api/catalog';
import { DialoguePhase } from '@/types';
import { deriveDisplayStatus } from '../../utils/deriveDisplayStatus';
import { useApp } from '@/hooks/useApp';
import { useConversation } from './hooks/useConversation/useConversation';
import { loadDerivedIntent, type DerivedIntent } from './utils/derivedIntent';
import { CreateHeader } from '../CreateHeader';
import { MessageBubble } from '../MessageBubble';
import { MessageInput } from '../MessageInput';
import { GenerationPanel } from '../GenerationPanel';
import { ResponseProgress } from '../ResponseProgress';
import { Sidebar } from '../Sidebar';
import { buildDerivedRequest } from './utils/buildDerivedRequest';
import type { DerivedMode } from './types';
import { ChatSpecification } from '../ChatSpecification';
import { bindSidebarGesture } from '../sidebarGesture';
import { useConversationDetailQuery } from '@/api/conversations';
import { ContactCollectionForm } from '@/components/ui/contact/ContactCollectionForm';

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
  const entryIntentKey = requestedMode === 'create'
    ? `create:${params.get('new') || 'default'}`
    : derivedEntry ? `${derivedMode}:${baseType || 'auto'}:${baseId}:${params.get('new') || ''}` : undefined;
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
  const [draft, setDraft] = useState({ conversationId: '', value: '' });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const {
    dialogues, activeId, activeDialogue, entryConversationId, isTyping, connectionError, startNewSession, retryEntrySession,
    loadMoreDialogues, hasMoreDialogues, isLoadingMoreDialogues,
    loadMoreArchived, hasMoreArchived, isLoadingMoreArchived, archivedTotal,
    togglePin, deleteDialogue, sendMessage, sendOptionMessage, acceptRecommendation, rejectRecommendation, generation,
    generationError, retryGeneration, refreshGeneration, isRetryingGeneration, retryGenerationError, cancelGeneration,
    isCancellingGeneration, cancelGenerationError, production, productionLoading, productionError, refreshProduction,
    canRetryResponse, retryResponse, responsePending, responseProgress, briefProgress, socketConnected,
  } = useConversation({ entryIntentKey, entryReady: sourceReady, entryTitle, derivedIntent: entryDerivedIntent });
  const { data: conversationDetail } = useConversationDetailQuery(activeDialogue?.conversationId, user?.id ?? null);
  const isDemo = user?.role === 'DEMO';
  const isDemoReady = isDemo && conversationDetail?.id === activeDialogue?.conversationId
    && conversationDetail?.demoRequest?.status === 'ready' && Boolean(conversationDetail.demoRequest.revision.trim());
  const isDemoCompleted = isDemo && conversationDetail?.id === activeDialogue?.conversationId
    && conversationDetail?.status === 'completed';
  const isDemoFrozen = isDemoReady || isDemoCompleted;
  const inputValue = draft.conversationId === activeId ? draft.value : '';
  const messages = activeDialogue?.messages ?? [];
  const readableMessages = messages.filter((message) => !message.content.startsWith('MOCK_GENERATED_EXAMPLES:') && !message.content.startsWith('MOCK_SET_READY:'));
  const lastUserIndex = messages.findLastIndex((message) => message.role === 'user');
  const latestAssistant = messages.findLast((message) => message.role === 'assistant');
  const latestOptions = latestAssistant?.agentOptions?.length || latestAssistant?.structuredPrompt?.options.length || latestAssistant?.quickReplies?.length;
  const summary = messages.findLast((message, index) => index > lastUserIndex
    && message.role === 'assistant' && message.content.includes('Всё готово к подтверждению'));
  const showGeneration = isDemoCompleted ? generation?.status === 'succeeded' || production?.status === 'succeeded'
    : !isDemoReady && (activeDialogue?.conversationStatus === 'generating' || Boolean(generation && generation.status !== 'none'));
  const canConfirm = Boolean(!isDemo && summary && !isTyping && !responsePending && !activeDialogue?.outgoingMessage
    && activeDialogue?.conversationStatus !== 'generating' && activeDialogue?.conversationStatus !== 'abandoned' && !showGeneration);
  const dialogueName = activeDialogue ? lang === 'en' ? activeDialogue.benchmarkNameEn : activeDialogue.benchmarkName : undefined;
  const displayStatus = (isDemoReady && !isDemoCompleted) || canConfirm ? 'summary' : deriveDisplayStatus(activeDialogue, generation, production);
  const showSourceStatus = derivedEntry && (sourceLoading || sourceError || !source || !entryConversationId);
  const inputDisabled = !activeId || isDemoFrozen || activeDialogue?.conversationStatus === 'abandoned' || Boolean(activeDialogue?.outgoingMessage)
    || Boolean(derivedEntry && (!sourceReady || activeId !== entryConversationId));

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTo({ top: thread.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [activeDialogue?.messages, activeId, isTyping, isDemoFrozen, generation?.status, generation?.examples.length]);
  useEffect(() => {
    const root = chatRef.current;
    const side = root?.querySelector<HTMLElement>('.cr-side');
    if (root && side) return bindSidebarGesture(root, side, setMobileSidebarOpen);
  }, []);
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileSidebarOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileSidebarOpen]);

  const handleSendMessage = useCallback(async (textOverride?: string) => {
    const text = textOverride ?? inputValue;
    if (!text.trim() || !activeId || isTyping || inputDisabled) return;
    const firstDerivedMessage = derivedEntry && derivedMode && source
      && !messages.some((message) => message.role === 'user' && message.content.includes(`ID исходного бенчмарка: ${baseId}`));
    const message = firstDerivedMessage ? buildDerivedRequest(derivedMode, source, sourceTests, text.trim()) : text;
    if (textOverride === undefined) setDraft({ conversationId: activeId, value: '' });
    await sendMessage(message);
  }, [activeId, baseId, derivedEntry, derivedMode, inputDisabled, inputValue, isTyping, messages, sendMessage, source, sourceTests]);
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSendMessage();
    }
  }, [handleSendMessage]);

  return <div className="bf-theme bf-app bf-chat view full" id="v-create">
    <div id="cr" ref={chatRef} className={`cr${mobileSidebarOpen ? ' side-open' : ''}`}>
      <div className="cr-scrim" aria-hidden="true" onClick={() => setMobileSidebarOpen(false)} />
      <Sidebar key={user?.id} dialogues={dialogues} activeId={activeId}
        onLoadMore={() => loadMoreDialogues({ cancelRefetch: false })} hasMore={hasMoreDialogues} isLoadingMore={isLoadingMoreDialogues}
        onLoadMoreArchived={() => loadMoreArchived({ cancelRefetch: false })} hasMoreArchived={hasMoreArchived}
        isLoadingMoreArchived={isLoadingMoreArchived} archivedTotal={archivedTotal}
        onNewSession={() => { startNewSession(); if (entryIntentKey) navigate('/create', { replace: true }); setMobileSidebarOpen(false); }}
        onSelectDialogue={(id) => {
          const intent = loadDerivedIntent(user?.id, id);
          const next = new URLSearchParams({ session: id });
          if (intent) { next.set('mode', intent.mode); next.set('base', intent.baseId); next.set('baseType', intent.baseType); }
          navigate(`/create?${next.toString()}`, { replace: true });
          setMobileSidebarOpen(false);
        }}
        onTogglePin={togglePin}
        onDeleteDialogue={async (id) => { await deleteDialogue(id); setDraft(previous => previous.conversationId === id ? { conversationId: '', value: '' } : previous); }}
        deriveDisplayStatus={(dialogue) => deriveDisplayStatus(dialogue, dialogue.id === activeId ? generation : undefined, dialogue.id === activeId ? production : undefined)}
        mobileOpen={mobileSidebarOpen} onToggleMobile={() => setMobileSidebarOpen((open) => !open)} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <section className="cr-main" aria-label="Чат создания бенчмарка">
        <CreateHeader dialogueName={dialogueName} displayStatus={displayStatus} mobileOpen={mobileSidebarOpen} onToggleMobile={() => setMobileSidebarOpen((open) => !open)} />
        <div className="thread" id="thread" ref={threadRef} aria-live="polite"><div className="thread-in" id="threadIn">
          {connectionError && <div className="card err" role="alert"><p>{connectionError}</p></div>}
          {showSourceStatus && <div className="m a"><span className="ava" aria-hidden="true" /><div className="body"><div className="card">
            {sourceLoading ? <p>Загружаем исходный бенчмарк…</p> : sourceError || !source ? <>
              <p>Не удалось загрузить исходный бенчмарк.</p><div className="chips"><button className="btn btn-secondary btn-sm" type="button" onClick={() => { if (isSuiteSource) { void refetchSuite(); void refetchTests(); } else { if (detectBaseType) void refetchSuite(); void refetchTest(); } }}>Повторить</button></div>
            </> : <><p>Открываем новый чат…</p>{connectionError && <button className="btn btn-secondary btn-sm" type="button" onClick={retryEntrySession}>Повторить</button>}</>}
          </div></div></div>}
          {readableMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} benchmarks={allBenchmarks}
            recommendationDisabled={isTyping || inputDisabled || Boolean(activeDialogue?.conversationId && activeDialogue.conversationStatus !== 'active' && activeDialogue.conversationStatus !== 'awaiting_choice')}
            onAcceptRecommendation={acceptRecommendation} onRejectRecommendation={rejectRecommendation}
            optionsDisabled={Boolean(isTyping || responsePending || inputDisabled || activeDialogue?.outgoingMessage || msg.id !== latestAssistant?.id || messages.indexOf(msg) < lastUserIndex)}
            onSendOption={sendOptionMessage} onSendText={(text) => { void handleSendMessage(text); }}
            onConfirmGeneration={canConfirm && msg.id === summary?.id ? () => { void handleSendMessage('Требования подтверждаю. Начни генерацию бенчмарка по согласованной сводке.'); } : undefined} />)}
          {!isDemoFrozen && activeDialogue?.outgoingMessage && <p className="muted" role="status">{activeDialogue.outgoingMessage.delivery === 'sending' ? t.create.messageSending : t.create.messageUnconfirmed}</p>}
          {isDemoFrozen && user?.id && activeDialogue?.conversationId && <ContactCollectionForm
            ownerId={user.id} conversationId={activeDialogue.conversationId} context={isDemoCompleted ? 'ready-test' : 'new-test'} />}
          {!isDemoFrozen && (canRetryResponse || activeDialogue?.retryingResponse) && <div className="chips"><button className="btn btn-secondary btn-sm" type="button" disabled={activeDialogue?.retryingResponse} onClick={retryResponse}>
            {activeDialogue?.retryingResponse ? t.create.responseRetrying : activeDialogue?.outgoingMessage ? t.create.messageResend : t.create.responseRetry}
          </button></div>}
          {showGeneration && <GenerationPanel key={`${activeId}:${generation?.jobId ?? ''}`}
            readOnly={isDemoCompleted}
            generation={generation} loadError={generationError} retryError={retryGenerationError} isRetrying={isRetryingGeneration}
            onRetry={retryGeneration} onRefresh={refreshGeneration} onCancel={cancelGeneration} isCancelling={isCancellingGeneration} cancelError={cancelGenerationError}
            production={production} productionLoading={productionLoading} productionError={productionError} onProductionRefresh={refreshProduction}
            onRegenerate={isTyping || inputDisabled ? undefined : () => { void handleSendMessage('Сгенерируй примеры заново с учетом согласованных требований.'); }} />}
          {!isDemoFrozen && (responsePending ? <ResponseProgress connected={socketConnected && !connectionError} message={responseProgress} progress={briefProgress} />
            : isTyping && !activeDialogue?.outgoingMessage && <div className="m a"><span className="ava" aria-hidden="true" /><div className="body"><span className="typing" aria-label="BenchFactory печатает"><i /><i /><i /></span></div></div>)}
        </div></div>
        <MessageInput inputValue={inputValue} isTyping={isTyping} disabled={inputDisabled}
          placeholder={latestOptions && messages.indexOf(latestAssistant!) > lastUserIndex && !(!requestedMode && messages.length === 1 && lastUserIndex < 0) ? 'Выберите вариант или напишите свой…' : requestedMode === 'create' && !messages.some((message) => message.role === 'user') ? 'Опишите, что нужно проверить…' : !messages.some((message) => message.role === 'user') ? 'Опишите задачу или выберите вариант…' : 'Выберите вариант или напишите свой…'}
          onSend={() => { void handleSendMessage(); }} onChange={(value) => setDraft({ conversationId: activeId || '', value })} onKeyDown={handleKeyDown} />
      </section>
      <ChatSpecification key={`${user?.id}:${activeId}`} mode={requestedMode || (activeDialogue?.phase === DialoguePhase.Create ? 'create' : undefined)} sourceName={source?.name} specification={conversationDetail?.specification} />
    </div>
  </div>;
};
