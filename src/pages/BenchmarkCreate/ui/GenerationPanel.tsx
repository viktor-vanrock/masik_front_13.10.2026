import { AlertCircle, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { ConversationGenerationDto, ConversationProductionDto } from '@/api/conversations';
import { useApp } from '@/hooks/useApp';

interface Props {
  generation?: ConversationGenerationDto;
  loadError: boolean;
  retryError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  onCancel: () => void;
  isCancelling: boolean;
  cancelError: boolean;
  production?: ConversationProductionDto;
  productionLoading: boolean;
  productionError: boolean;
  onProductionRefresh: () => void;
  onStartProduction: (numTasks: number, creatorJobId: string, selectedIndices: number[]) => void;
  isStartingProduction: boolean;
  startProductionError: boolean;
  hideSuccessStatus?: boolean;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return JSON.stringify(value, null, 2);
}

function optionText(choices: unknown): string {
  if (Array.isArray(choices)) {
    return choices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${text(choice)}`).join('\n');
  }
  if (choices && typeof choices === 'object') {
    return Object.entries(choices).map(([key, value]) => `${key}. ${text(value)}`).join('\n');
  }
  return text(choices);
}

function taskContent(example: Record<string, unknown>) {
  const task = typeof example.task === 'object' && example.task !== null
    ? example.task as Record<string, unknown>
    : example;
  const input = example.input ?? task.question ?? task.input ?? example.question;
  const choices = task.options ?? task.choices;
  const options = choices ? `\n${optionText(choices)}` : '';
  return {
    input: input == null ? text(example) : `${text(input)}${options}`,
    output: text(example.output ?? task.correct_answer ?? task.ground_truth ?? task.output ?? task.answer),
  };
}

function downloadProduction(examples: Array<Record<string, unknown>>) {
  const content = examples.map((example) => JSON.stringify(example)).join('\n') + '\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'application/x-ndjson;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'benchmark-production.jsonl';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function GenerationPanel({ generation, loadError, retryError, isRetrying, onRetry, onRefresh,
  onCancel, isCancelling, cancelError, production, productionLoading, productionError,
  onProductionRefresh, onStartProduction, isStartingProduction, startProductionError, hideSuccessStatus = false }: Props) {
  const { t } = useApp();
  const labels = t.create.generation;
  const failed = generation?.status === 'failed';
  const succeeded = generation?.status === 'succeeded';
  const cancelled = generation?.status === 'cancelled';
  const canCancel = !!generation?.jobId && (generation.status === 'queued' || generation.status === 'running');
  const title = cancelled ? labels.cancelled : failed ? labels.failed : succeeded ? labels.succeeded
    : generation?.status === 'running' ? labels.running : labels.queued;
  const progress = generation?.progress;
  const [now, setNow] = useState(() => Date.now());
  const [requestedCount, setRequestedCount] = useState(100);
  const [selection, setSelection] = useState<{
    creatorJobId: string | null; productionJobId: string | null; indices: number[];
  } | null>(null);
  const sliderId = useId();
  const estimate = progress?.estimatedCompletionAt ? Date.parse(progress.estimatedCompletionAt) : NaN;
  const total = progress?.totalLlmCalls;
  const completed = Math.max(0, progress?.completedLlmCalls ?? 0);
  const finalizing = progress?.phase === 'publishing';
  const showEta = generation?.status === 'running' && !finalizing && !!total;
  useEffect(() => {
    if (!showEta || !Number.isFinite(estimate)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [estimate, showEta]);
  const secondsLeft = (estimate - now) / 1000;
  const minutes = Math.ceil(secondsLeft / 60);
  const duration = secondsLeft < 60 ? labels.etaSoon : minutes < 60
    ? labels.etaMinutes.replace('{minutes}', String(minutes))
    : labels.etaHours.replace('{hours}', String(Math.floor(minutes / 60))).replace('{minutes}', String(minutes % 60));
  const productionActive = production?.status === 'queued' || production?.status === 'running';
  const productionFinished = production?.status === 'succeeded';
  const productionLocked = productionActive || productionFinished || isStartingProduction;
  const taskCount = generation?.examples.length ?? 0;
  const allIndices = Array.from({ length: taskCount }, (_, index) => index);
  const selectedIndices = selection && selection.creatorJobId === generation?.jobId
    && selection.productionJobId === (production?.jobId ?? null)
    ? selection.indices
    : production?.jobId && production.selectedIndices != null ? production.selectedIndices : allIndices;
  const selectedSet = new Set(selectedIndices);
  const toggleSelection = (index: number) => {
    setSelection({
      creatorJobId: generation?.jobId ?? null,
      productionJobId: production?.jobId ?? null,
      indices: selectedSet.has(index) ? selectedIndices.filter((item) => item !== index)
        : [...selectedIndices, index].sort((a, b) => a - b),
    });
  };
  const sourceCount = selectedIndices.length;
  const maximumProductionCount = sourceCount > 0 && sourceCount <= 1000
    ? Math.floor(1000 / sourceCount) * sourceCount : 0;
  const validRequestedCount = maximumProductionCount > 0
    ? Math.min(maximumProductionCount, Math.max(sourceCount, Math.floor(requestedCount / sourceCount) * sourceCount))
    : 0;
  const selectedCount = productionActive || productionFinished
    ? production?.requestedCount ?? validRequestedCount : validRequestedCount;
  const canStartProduction = succeeded && !!generation?.jobId && selectedIndices.length > 0
    && maximumProductionCount > 0 && !productionLoading && !productionError && !productionLocked;
  const productionTotal = production?.requestedCount ?? 0;
  const producedCount = Math.max(0, production?.generatedCount ?? 0);
  const preview = production?.examples.slice(0, 10) ?? [];

  return (
    <section className={hideSuccessStatus ? 'p-4 space-y-4' : 'ml-11 rounded-2xl p-4 space-y-4'} aria-label={title}
      style={{ backgroundColor: 'var(--bg-card)', border: hideSuccessStatus ? 'none' : '1px solid var(--border)', color: 'var(--text-primary)' }}>
      {!(succeeded && hideSuccessStatus) && <div role="status" aria-live="polite" className="flex items-center gap-2 font-medium">
        {cancelled ? <Ban size={18} /> : failed ? <AlertCircle size={18} />
          : succeeded ? <CheckCircle2 size={18} /> : <Loader2 size={18} className="animate-spin" />}
        {title}{succeeded && ` (${generation.examples.length})`}
      </div>}
      {!failed && !succeeded && !cancelled && (
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>{labels.waiting}</p>
          {total ? (
            <>
              <div className="flex flex-wrap justify-between gap-2">
                <p>{labels.llmCalls}: {completed} / {labels.maximum} {total}</p>
                <span>{Math.min(100, Math.floor(completed / total * 100))}%</span>
              </div>
              <progress className="w-full" value={Math.min(completed, total)} max={total} aria-label={labels.llmCalls} />
              <p>{labels.llmBudgetHint}</p>
              {finalizing ? <p>{labels.finalizing}</p> : showEta && (
                <p>{completed >= total ? labels.etaExceeded : !Number.isFinite(estimate) ? labels.estimating : secondsLeft <= 0
                  ? labels.etaExceeded : `${labels.eta}: ${duration}`}</p>
              )}
            </>
          ) : !!progress?.totalGenerations && (
            <>
              <p>{labels.completed}: {progress.completedGenerations} / {progress.totalGenerations}</p>
              <progress className="w-full" value={progress.completedGenerations} max={progress.totalGenerations} aria-label={labels.completed} />
            </>
          )}
        </div>
      )}
      {canCancel && <div className="space-y-2 text-sm">
        <button type="button" onClick={onCancel} disabled={isCancelling}
          className="px-3 py-2 rounded-lg disabled:opacity-50"
          style={{ border: '1px solid var(--border)' }}>
          {isCancelling ? labels.cancelling : labels.cancel}
        </button>
        {cancelError && <p role="alert">{labels.cancelFailed}</p>}
      </div>}
      {cancelled && <p className="text-sm">{labels.cancelledHint}</p>}
      {loadError && (
        <div role="alert" className="text-sm space-y-2">
          <p>{labels.loadFailed}</p>
          <button type="button" className="underline" onClick={onRefresh}>{labels.refresh}</button>
        </div>
      )}
      {(failed || cancelled) && (
        <div className="text-sm space-y-3">
          {generation.error?.message && <p role="alert">{generation.error.message}</p>}
          <button type="button" onClick={onRetry} disabled={isRetrying}
            className="px-3 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--white)' }}>
            {isRetrying ? labels.retrying : labels.retry}
          </button>
          {retryError && <p role="alert">{labels.retryFailed}</p>}
        </div>
      )}
      {succeeded && generation.examples.length === 0 && <p role="alert">{labels.empty}</p>}
      {succeeded && generation.examples.length > 0 && <p className="text-sm" aria-live="polite">
        {labels.selectedTasks.replace('{selected}', String(selectedIndices.length)).replace('{total}', String(taskCount))}
      </p>}
      {succeeded && generation.examples.map((example, index) => {
        const task = taskContent(example);
        return (
          <article key={index} className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={selectedSet.has(index)} disabled={productionLocked}
                onChange={() => toggleSelection(index)}
                aria-label={labels.selectTask.replace('{number}', String(index + 1))} />
              <span>{labels.task} {index + 1}</span>
            </label>
            <p className="whitespace-pre-wrap break-words text-sm">{task.input}</p>
            {task.output && <div className="text-sm space-y-1">
              <h4 className="font-medium">{labels.expectedAnswer}</h4>
              <p className="whitespace-pre-wrap break-words">{task.output}</p>
            </div>}
          </article>
        );
      })}
      {succeeded && generation.examples.length > 0 && <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="space-y-2">
          <label htmlFor={sliderId} className="block text-sm font-medium">{labels.scaleCount}</label>
          {maximumProductionCount > 0 ? <>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{labels.productionCountMultiple
              .replace('{count}', String(sourceCount))}</p>
            <div className="flex items-center gap-4">
              <input id={sliderId} type="range" min={sourceCount} max={maximumProductionCount} step={sourceCount} value={selectedCount}
                onChange={(event) => setRequestedCount(Number(event.target.value))}
                disabled={productionLocked}
                className="w-full" />
              <output htmlFor={sliderId} className="min-w-12 text-right tabular-nums">{selectedCount}</output>
            </div>
          </> : sourceCount > 1000 ? <p role="alert" className="text-sm">{labels.productionTooManySources
            .replace('{count}', String(sourceCount))}</p> : null}
          {selectedIndices.length === 0 && <p className="text-sm" role="status">{labels.selectTaskHint}</p>}
          <button type="button" onClick={() => {
            if (generation.jobId && canStartProduction) onStartProduction(validRequestedCount, generation.jobId, selectedIndices);
          }} disabled={!canStartProduction}
          className="px-3 py-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--white)' }}>
            {isStartingProduction ? labels.scaling : labels.scaleButton}
          </button>
          {startProductionError && <p role="alert" className="text-sm">{labels.productionRequestFailed}</p>}
          {productionError && <div role="alert" className="text-sm space-x-2">
            <span>{labels.productionLoadFailed}</span>
            <button type="button" className="underline" onClick={onProductionRefresh}>{labels.refresh}</button>
          </div>}
        </div>
        {production && production.status !== 'none' && <div className="space-y-2 text-sm">
          <p aria-live="polite" className="font-medium">
            {production.status === 'queued' ? labels.productionQueued
              : production.status === 'running' ? labels.productionRunning
                : production.status === 'succeeded' ? labels.productionSucceeded
                  : production.status === 'cancelled' ? labels.productionCancelled : labels.productionFailed}
          </p>
          {productionTotal > 0 && (productionFinished ? <>
            <p>{labels.productionAccepted
              .replace('{accepted}', String(producedCount)).replace('{requested}', String(productionTotal))}</p>
            {producedCount < productionTotal && <p>{labels.productionFiltered
              .replace('{count}', String(productionTotal - producedCount))}</p>}
          </> : <>
            <div className="flex flex-wrap justify-between gap-2">
              <p>{labels.productionProgress}: {producedCount} / {productionTotal}</p>
              <span>{Math.min(100, Math.floor(producedCount / productionTotal * 100))}%</span>
            </div>
            <progress className="w-full" value={Math.min(producedCount, productionTotal)} max={productionTotal}
              aria-label={labels.productionProgress} />
          </>)}
          {production.error?.message && <p role="alert">{production.error.message}</p>}
          {productionFinished && production.examples.length > 0 && <button type="button"
            className="underline" onClick={() => downloadProduction(production.examples)}>
            {labels.productionDownload}
          </button>}
          {productionFinished && preview.length > 0 && <details className="space-y-2">
            <summary className="cursor-pointer font-medium">{labels.productionPreview.replace('{count}', String(preview.length))}</summary>
            <p style={{ color: 'var(--text-muted)' }}>{labels.productionPreviewHint
              .replace('{shown}', String(preview.length)).replace('{total}', String(producedCount))}</p>
            {preview.map((example, index) => {
              const task = taskContent(example);
              return <article key={index} className="space-y-1 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="font-medium">{labels.task} {index + 1}</h3>
                <p className="whitespace-pre-wrap break-words">{task.input}</p>
                {task.output && <p className="whitespace-pre-wrap break-words">{labels.expectedAnswer}: {task.output}</p>}
              </article>;
            })}
          </details>}
        </div>}
      </div>}
    </section>
  );
}
