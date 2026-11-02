import { useApp } from '@/hooks/useApp';
import type { ChatResponseProgress } from '@/types';

type Props = {
  connected: boolean;
  message: string | null;
  progress?: ChatResponseProgress;
};

export function ResponseProgress({ connected, message, progress }: Props) {
  const { t } = useApp();
  const labels = t.create.briefProgress;
  const saving = progress?.stage === 'save';
  return <div className="m a" role="status" aria-live="polite"><span className="ava" aria-hidden="true" /><div className="body">
    {progress ? <div className="card">
      <ol className="steps" aria-label={labels.preparation}>
        <li className="ok"><i aria-hidden="true">✓</i><span>{labels.requirements}</span><small>{labels.done}</small></li>
        <li className={saving ? 'ok' : connected ? 'on' : undefined} aria-current={!saving && connected ? 'step' : undefined}>
          <i aria-hidden="true">{saving ? '✓' : '2'}</i><span>{labels.preparation}</span><small>{saving ? labels.done : labels[progress.stage]}</small>
        </li>
        <li className={saving && connected ? 'on' : undefined} aria-current={saving && connected ? 'step' : undefined}>
          <i aria-hidden="true">3</i><span>{labels.saving}</span><small>{saving ? labels.save : ''}</small>
        </li>
      </ol>
      <p className="muted">{connected ? progress.message : labels.lastConfirmed.replace('{message}', progress.message)}</p>
    </div> : <>
      {connected && <span className="typing" aria-label="BenchFactory печатает"><i /><i /><i /></span>}
      <p className="muted">{connected ? message || t.create.responseProcessing : t.create.responseAwaitingConnection}</p>
    </>}
    {!connected && progress && <p className="muted">{t.create.responseAwaitingConnection}</p>}
    {!connected && <p className="muted">{t.create.responseAwaitingConnectionHint}</p>}
  </div></div>;
}
