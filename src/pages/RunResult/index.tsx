import { useMemo, useState } from 'react';
import { ChevronRight, Download } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useBenchmarkGroupsQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';
import { SOURCE_MODES, summarizeModelMode } from '@/utils/resultModes';
import type { SourceMode } from '@/types';

export function RunResult() {
  const navigate = useNavigate();
  const { lang, t } = useApp();
  const [downloadError, setDownloadError] = useState(false);
  const { modelId } = useParams<{ modelId: string }>();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('sourceMode');
  const invalidMode = requestedMode !== null && !SOURCE_MODES.includes(requestedMode as SourceMode);
  const sourceMode: SourceMode = invalidMode || requestedMode === null ? 'benchmark' : requestedMode as SourceMode;
  const { data: groupsResponse, isPending, isError, error, hasNextPage, isFetchingNextPage } = useBenchmarkGroupsQuery({}, { pageSize: 1000, loadAllPages: true });
  const runByMode = useMemo(() => {
    const tests = groupsResponse?.pages
      .flatMap((page) => page.data)
      .flatMap((group) => group.tests) ?? [];
    const modes = SOURCE_MODES.map((mode) => ({ mode, ...summarizeModelMode(tests, modelId ?? '', mode) }));
    return { modes, selected: summarizeModelMode(tests, modelId ?? '', sourceMode) };
  }, [groupsResponse, modelId, sourceMode]);
  const run = runByMode.selected;
  const metrics = [
    [t.runResult.quality, run.score != null ? `${run.score.toFixed(1)}%` : '—', 'loglikelihood accuracy'],
    [t.runResult.efficiency, typeof run.auqtc === 'number' && Number.isFinite(run.auqtc) ? run.auqtc.toFixed(3) : '—', 'AUQTC'],
    [t.runResult.speed, run.speed != null ? String(Math.round(run.speed)) : '—', t.runResult.tokensPerSecond],
    [t.runResult.compute, '—', t.runResult.gpuHours],
  ];

  const downloadResult = () => {
    let url: string | undefined;
    let link: HTMLAnchorElement | undefined;
    let revokeScheduled = false;
    try {
      setDownloadError(false);
      const result = JSON.stringify({ modelId, model: run.modelName, sourceMode, score: run.score, auqtc: run.auqtc, tokensPerSec: run.speed, resultsByMode: runByMode.modes }, null, 2);
      const createdUrl = URL.createObjectURL(new Blob([result], { type: 'application/json' }));
      url = createdUrl;
      link = document.createElement('a');
      link.href = url;
      link.download = 'run-result.json';
      document.body.append(link);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(createdUrl), 1000);
      revokeScheduled = true;
    } catch {
      setDownloadError(true);
    } finally {
      link?.remove();
      if (url && !revokeScheduled) URL.revokeObjectURL(url);
    }
  };

  if (isError) return <div className="run-result-page"><div className="run-result-container run-result-status">{error instanceof Error ? error.message : t.runResult.loadError}</div></div>;
  if (isPending || hasNextPage || isFetchingNextPage) return <div className="run-result-page"><div className="run-result-container run-result-status">{t.runResult.loading}</div></div>;
  if (!modelId || !run.modelName) return <div className="run-result-page"><div className="run-result-container run-result-status"><h1>{t.runResult.notFound}</h1><p>{t.runResult.openFromBoard}</p><button type="button" className="run-result-button primary" onClick={() => navigate(ROUTES.DASHBOARD)}>{t.runResult.backToBoards}</button></div></div>;

  return (
    <div className="run-result-page">
      <div className="run-result-container">
        <div className="run-result-breadcrumb"><button type="button" onClick={() => navigate(ROUTES.DASHBOARD)}>{t.runResult.boards}</button><ChevronRight size={16} />{t.runResult.result}</div>
        <header className="run-result-heading">
          <div>
            <div className="run-result-badges"><span className="run-result-badge">{t.runResult.assessmentResult}</span></div>
            <h1>{run.modelName}</h1>
            <p>{run.updatedAt ? `${t.runResult.lastUpdated} · ${new Date(run.updatedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU')}` : t.runResult.dateUnknown}</p>
          </div>
          <div className="run-result-actions">
            <button type="button" className="run-result-button" style={{ color: '#515dad' }} onClick={downloadResult}><Download size={18} />{t.runResult.downloadJson}</button>
          </div>
        </header>

        {downloadError && <p role="alert">{t.runResult.downloadError}</p>}

        {invalidMode && <p role="status">{t.runResult.invalidMode}</p>}
        <section className="run-result-metrics" aria-label={t.runResult.resultsRegion}>
          {metrics.map(([label, value, hint]) => <article key={label}><small>{label}</small><strong>{value}</strong><em>{hint}</em></article>)}
        </section>

        <div className="run-result-grid">
          <section className="run-result-panel">
            <h2>{t.runResult.constraints}</h2>
            <p>—</p>
          </section>
          <section className="run-result-panel">
            <h2>{t.runResult.configuration}</h2>
            <dl>
              <div><dt>{t.runResult.mode}</dt><dd>{sourceMode}</dd></div>
              <div><dt>{t.runResult.budget}</dt><dd>—</dd></div>
              <div><dt>{t.runResult.basket}</dt><dd>—</dd></div>
              <div><dt>{t.runResult.datasets}</dt><dd>—</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
