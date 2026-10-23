import { useMemo } from 'react';
import { ChevronRight, Download } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useBenchmarkGroupsQuery } from '@/api/catalog';
import { ROUTES } from '@/routes/routes.constants';
import { SOURCE_MODES, summarizeModelMode } from '@/utils/resultModes';
import type { SourceMode } from '@/types';

export function RunResult() {
  const navigate = useNavigate();
  const { modelId } = useParams<{ modelId: string }>();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('sourceMode');
  const sourceMode: SourceMode = SOURCE_MODES.includes(requestedMode as SourceMode) ? requestedMode as SourceMode : 'benchmark';
  const { data: groupsResponse, isPending, isError, error } = useBenchmarkGroupsQuery({}, { pageSize: 1000 });
  const runByMode = useMemo(() => {
    const tests = groupsResponse?.pages
      .flatMap((page) => page.data)
      .flatMap((group) => group.tests) ?? [];
    const modes = SOURCE_MODES.map((mode) => ({ mode, ...summarizeModelMode(tests, modelId ?? '', mode) }));
    return { modes, selected: modes.find((result) => result.mode === sourceMode)! };
  }, [groupsResponse, modelId, sourceMode]);
  const run = { ...runByMode.selected, modelName: runByMode.selected.modelName ?? runByMode.modes.find((result) => result.modelName)?.modelName };
  const metrics = [
    ['Качество', run.score != null ? `${run.score.toFixed(1)}%` : '—', 'loglikelihood accuracy'],
    ['Эффективность', run.auqtc != null ? run.auqtc.toFixed(3) : '—', 'AUQTC'],
    ['Скорость', run.speed != null ? String(Math.round(run.speed)) : '—', 'токенов в секунду'],
    ['Вычисления', '—', 'GPU·ч'],
  ];

  const downloadResult = () => {
    const result = JSON.stringify({ modelId, model: run.modelName, sourceMode, score: run.score, auqtc: run.auqtc, tokensPerSec: run.speed, resultsByMode: runByMode.modes }, null, 2);
    const url = URL.createObjectURL(new Blob([result], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'run-result.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isPending) return <div className="run-result-page"><div className="run-result-container run-result-status">Загрузка результата прогона…</div></div>;
  if (isError) return <div className="run-result-page"><div className="run-result-container run-result-status">{error instanceof Error ? error.message : 'Не удалось загрузить результат прогона.'}</div></div>;
  if (!modelId || !run.modelName) return <div className="run-result-page"><div className="run-result-container run-result-status"><h1>Результат не найден</h1><p>Откройте результат из строки модели в лидерборде.</p><button type="button" className="run-result-button primary" onClick={() => navigate(ROUTES.DASHBOARD)}>К лидербордам</button></div></div>;

  return (
    <div className="run-result-page">
      <div className="run-result-container">
        <div className="run-result-breadcrumb"><button type="button" onClick={() => navigate(ROUTES.DASHBOARD)}>Лидерборды</button><ChevronRight size={16} />Результат прогона</div>
        <header className="run-result-heading">
          <div>
            <div className="run-result-badges"><span className="run-result-badge">Результат оценки</span></div>
            <h1>{run.modelName}</h1>
            <p>{run.updatedAt ? `Последнее обновление · ${new Date(run.updatedAt).toLocaleDateString('ru-RU')}` : 'Дата результата не указана'}</p>
          </div>
          <div className="run-result-actions">
            <button type="button" className="run-result-button" onClick={downloadResult}><Download size={18} />Скачать JSON</button>
            <button type="button" className="run-result-button primary" aria-disabled="true" tabIndex={-1}>Новый прогон<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button>
          </div>
        </header>

        {/* <label>Режим результатов <select aria-label="Режим результатов" value={sourceMode} onChange={(event) => setSearchParams({ sourceMode: event.target.value })}>
          {SOURCE_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
        </select></label> */}
        <section className="run-result-metrics" aria-label="Результаты прогона">
          {metrics.map(([label, value, hint]) => <article key={label}><small>{label}</small><strong>{value}</strong><em>{hint}</em></article>)}
        </section>

        <div className="run-result-grid">
          <section className="run-result-panel">
            <h2>Контроль ограничений</h2>
            <p>—</p>
          </section>
          <section className="run-result-panel">
            <h2>Конфигурация</h2>
            <dl>
              <div><dt>Режим</dt><dd>{sourceMode}</dd></div>
              <div><dt>Бюджет</dt><dd>—</dd></div>
              <div><dt>Корзина</dt><dd>—</dd></div>
              <div><dt>Наборы</dt><dd>—</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
