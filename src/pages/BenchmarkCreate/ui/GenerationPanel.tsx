import { useEffect, useId, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ConversationGenerationDto, ConversationProductionDto } from '@/api/conversations';
import { useApp } from '@/hooks/useApp';
import { Pluralord } from '@/utils.ts/pluralRu';

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
  onRegenerate?: () => void;
  onStartProduction?: (numTasks: number, creatorJobId: string, selectedIndices: number[]) => void;
  isStartingProduction?: boolean;
  startProductionError?: boolean;
  hideSuccessStatus?: boolean;
  readOnly?: boolean;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  return value == null ? '' : JSON.stringify(value, null, 2);
}
function taskContent(example: Record<string, unknown>) {
  const task = typeof example.task === 'object' && example.task !== null ? example.task as Record<string, unknown> : example;
  const choices = task.options ?? task.choices;
  const options = Array.isArray(choices)
    ? choices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${text(choice)}`).join('\n')
    : choices && typeof choices === 'object' ? Object.entries(choices).map(([key, value]) => `${key}. ${text(value)}`).join('\n') : text(choices);
  const input = example.input ?? task.question ?? task.input ?? example.question;
  return {
    input: input == null ? text(example) : `${text(input)}${options ? `\n${options}` : ''}`,
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

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const current = Math.max(0, Math.min(value, max));
  return <div className="prog" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={current}>
    <i style={{ '--p': `${current / max * 100}%` } as CSSProperties} />
  </div>;
}

export function GenerationPanel({ generation, loadError, retryError, isRetrying, onRetry, onRefresh,
  onCancel, isCancelling, cancelError, production, productionLoading, productionError, onProductionRefresh, onRegenerate, isStartingProduction = false, readOnly = false }: Props) {
  const { t } = useApp();
  const labels = t.create.generation;
  const id = useId();
  const failed = generation?.status === 'failed';
  const succeeded = generation?.status === 'succeeded';
  const cancelled = generation?.status === 'cancelled';
  const canCancel = !!generation?.jobId && (generation.status === 'queued' || generation.status === 'running');
  const title = readOnly && production?.status === 'succeeded' ? labels.productionSucceeded
    : cancelled ? labels.cancelled : failed ? labels.failed : succeeded ? labels.succeeded
      : generation?.status === 'running' ? labels.running : labels.queued;
  const progress = generation?.progress;
  const [now, setNow] = useState(() => Date.now());
  const [selection, setSelection] = useState<{
    creatorJobId: string | null; productionJobId: string | null; indices: number[];
  } | null>(null);
  const estimate = progress?.estimatedCompletionAt ? Date.parse(progress.estimatedCompletionAt) : NaN;
  const total = progress?.totalLlmCalls;
  const completed = Math.max(0, progress?.completedLlmCalls ?? 0);
  const finalizing = progress?.phase === 'publishing';
  const showEta = !readOnly && generation?.status === 'running' && !finalizing && !!total;
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
  const productionLocked = readOnly || productionActive || productionFinished || isStartingProduction;
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
  const productionTotal = production?.requestedCount ?? 0;
  const producedCount = Math.max(0, production?.generatedCount ?? 0);
  const preview = production?.examples.slice(0, 10) ?? [];

  return <div className="m a"><span className="ava" aria-hidden="true" /><section className="body" aria-label={title}>
    {loadError ? <div className="card" role="alert"><p>{labels.loadFailed}</p>
      <div className="chips"><button className="btn btn-secondary btn-sm" type="button" onClick={onRefresh}>{labels.refresh}</button></div>
    </div> : <>
      {(!readOnly || succeeded) && <p className={succeeded ? 'sr-only' : undefined} role="status" aria-live="polite">{title}{succeeded && ` (${taskCount})`}</p>}
      {!readOnly && !failed && !succeeded && !cancelled && <div className="card">
        <ol className="steps">
          <li className={generation?.jobId ? 'ok' : ''}><i>{generation?.jobId ? '✓' : '1'}</i><span><b>Интервьюер</b> — спецификация собрана</span><small>{generation?.jobId ? 'готово' : ''}</small></li>
          <li className={generation?.status === 'running' ? 'on' : ''}><i>2</i><span><b>Изобретатель</b> — генерирует гипотезы заданий</span><small>{generation?.status === 'running' ? 'в работе' : ''}</small></li>
          <li><i>3</i><span><b>Валидатор</b> — прогоняет примеры на моделях</span><small /></li>
        </ol>
        {!!total && <><div className="generation-progress"><span className="muted">{labels.llmCalls}: {completed} / {labels.maximum} {total}</span>{' '}<span className="generation-percentage">{Math.min(100, Math.floor(completed / total * 100))}%</span></div>
          <ProgressBar label={labels.llmCalls} max={total} value={completed} /><p className="muted">{labels.llmBudgetHint}</p></>}
        {generation?.status === 'running' && finalizing && <p className="muted">{labels.finalizing}</p>}
        {showEta && !finalizing && <p className="muted">{completed >= (total || Infinity) || secondsLeft <= 0 ? labels.etaExceeded : !Number.isFinite(estimate) ? labels.estimating : `${labels.eta}: ${duration}`}</p>}
        {!total && !!progress?.totalGenerations && <><p className="muted">{labels.completed}: {progress.completedGenerations} / {progress.totalGenerations}</p><ProgressBar max={progress.totalGenerations} value={progress.completedGenerations} label={labels.completed} /></>}
        <div className="chips"><button className="btn btn-secondary btn-sm" type="button" onClick={onRefresh}>{labels.refresh}</button>
          {canCancel && <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel} disabled={isCancelling}>{isCancelling ? labels.cancelling : labels.cancel}</button>}
        </div>{cancelError && <p role="alert">{labels.cancelFailed}</p>}
      </div>}
      {!readOnly && (failed || cancelled) && <div className="card">
        {generation?.error?.message && <p role="alert">{generation.error.message}</p>}
        <div className="chips"><button className="btn btn-primary btn-sm" type="button" onClick={onRetry} disabled={isRetrying}>{isRetrying ? labels.retrying : labels.retry}</button></div>
        {retryError && <p role="alert">{labels.retryFailed}</p>}
      </div>}
      {succeeded && <>
        <p>{readOnly ? 'Сохранённые примеры.' : 'Вот первые примеры. Снимите отметку с неудачных.'}</p><p className="sr-only" aria-live="polite">{labels.selectedTasks.replace('{selected}', String(selectedIndices.length)).replace('{total}', String(taskCount))}</p>
        {taskCount === 0 && <p role="alert">{labels.empty}</p>}
        {generation.examples.map((example, index) => {
          const task = taskContent(example);
          const checked = selectedSet.has(index);
          return <article key={index} className={`sample${checked ? '' : ' off'}`}>
            <input className="cbx" type="checkbox" checked={checked} disabled={productionLocked} aria-label={labels.selectTask.replace('{number}', String(index + 1))}
              onChange={() => toggleSelection(index)} />
            <div className="fields"><label className="overline" htmlFor={`${id}-${index}-input`}>Пример {index + 1} · задание</label>
              <textarea id={`${id}-${index}-input`} rows={2} readOnly value={task.input} />
              <label className="overline" htmlFor={`${id}-${index}-output`}>Эталонный ответ</label><textarea id={`${id}-${index}-output`} rows={1} readOnly value={task.output} />
            </div>
          </article>;
        })}
        {!readOnly && taskCount > 0 && <div className="chips"><button className="btn btn-primary btn-sm" type="button" disabled>Утвердить {selectedIndices.length} {Pluralord(selectedIndices.length, ['пример', 'примера', 'примеров'])}</button>
          <button className="btn btn-secondary btn-sm" type="button" onClick={onRegenerate} disabled={!onRegenerate}>Сгенерировать заново</button></div>}
      </>}
    </>}
    {productionError && <div className="card" role="alert"><p>{labels.productionLoadFailed}</p><button className="btn btn-secondary btn-sm" type="button" onClick={onProductionRefresh}>{labels.refresh}</button></div>}
    {!readOnly && productionLoading && <p role="status">{labels.productionQueued}</p>}
    {production && production.status !== 'none' && (!readOnly || productionFinished) && <div className="card">
      <p>{production.status === 'queued' ? labels.productionQueued : production.status === 'running' ? labels.productionRunning
        : production.status === 'succeeded' ? labels.productionSucceeded : production.status === 'cancelled' ? labels.productionCancelled : labels.productionFailed}</p>
      {productionTotal > 0 && (productionFinished ? <><p>{labels.productionAccepted.replace('{accepted}', String(producedCount)).replace('{requested}', String(productionTotal))}</p>{producedCount < productionTotal && <p>{labels.productionFiltered.replace('{count}', String(productionTotal - producedCount))}</p>}</> : <><p className="mono">{labels.productionProgress}: {producedCount} / {productionTotal}</p><ProgressBar label={labels.productionProgress} max={productionTotal} value={producedCount} /></>)}
      {production.error?.message && <p role="alert">{production.error.message}</p>}
      {productionFinished && production.examples.length > 0 && <button className="btn btn-secondary btn-sm" type="button" onClick={() => downloadProduction(production.examples)}>{labels.productionDownload}</button>}
      {productionFinished && preview.length > 0 && <details><summary>{labels.productionPreview.replace('{count}', String(preview.length))}</summary><p className="muted">{labels.productionPreviewHint.replace('{shown}', String(preview.length)).replace('{total}', String(producedCount))}</p>{preview.map((example, index) => { const task = taskContent(example); return <article key={index}><h3>{labels.task} {index + 1}</h3><p>{task.input}</p>{task.output && <p>{labels.expectedAnswer}: {task.output}</p>}</article>; })}</details>}
    </div>}
  </section></div>;
}
