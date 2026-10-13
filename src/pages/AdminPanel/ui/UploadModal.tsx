import { useMemo, useState, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useCreateMetricResultMutation,
  useMetricDefinitionsQuery,
  useMetricModelsQuery,
} from '@/api/metrics';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';
import type { BenchmarkType } from '@/types';
import { hasAssignedMetric } from './validationRules';

interface Props {
  uploadTarget: BenchmarkType;
  setUploadTarget: (item: BenchmarkType | null) => void;
}

const fieldStyle = {
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
};

export const UploadModal = ({ uploadTarget, setUploadTarget }: Props) => {
  const { t, lang } = useApp();
  const { data: definitionsResponse, isPending: areDefinitionsPending } =
    useMetricDefinitionsQuery({ limit: 1000, sortColumn: 'name', sortDirection: 'ASC' });
  const { data: models = [], isPending: areModelsPending } = useMetricModelsQuery();
  const createResult = useCreateMetricResultMutation();
  const [metricId, setMetricId] = useState('');
  const [modelId, setModelId] = useState('');
  const [value, setValue] = useState('');
  const [obtainedAt, setObtainedAt] = useState('');
  const needsMetricAssignment = !hasAssignedMetric(uploadTarget);

  const definitions = useMemo(() => {
    const all = definitionsResponse?.data ?? [];
    if (uploadTarget.metrics.length === 0) return [];

    const assigned = new Set(uploadTarget.metrics);
    // The catalogue returns canonical MetricDefinition.name values. A display
    // label can belong to a different, unassigned definition with another UUID.
    return all.filter((definition) =>
      assigned.has(definition.name),
    );
  }, [definitionsResponse, uploadTarget.metrics]);

  const activeMetricId = definitions.some((definition) => definition.id === metricId)
    ? metricId
    : (definitions[0]?.id ?? '');
  const activeModelId = models.some((model) => model.id === modelId)
    ? modelId
    : (models[0]?.id ?? '');
  const numericValue = Number(value);
  const canSubmit = activeMetricId !== '' && activeModelId !== '' &&
    value.trim() !== '' && Number.isFinite(numericValue) && !createResult.isPending;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    createResult.mutate({
      testId: uploadTarget.id,
      metricId: activeMetricId,
      modelId: activeModelId,
      value: numericValue,
      obtainedAt: obtainedAt ? new Date(obtainedAt).toISOString() : undefined,
      importSource: 'benchmark-catalog-admin',
    }, {
      onSuccess: () => setUploadTarget(null),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={() => setUploadTarget(null)}
    >
      <form
        className="w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <Upload size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t.admin.uploadTitle}
            </h2>
            <p className="text-xs truncate max-w-[300px]" style={{ color: 'var(--text-muted)' }}>
              {lang === 'en' ? uploadTarget.nameEn : uploadTarget.name}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="block mb-1.5">{t.admin.metricField}</span>
            <select value={activeMetricId} onChange={(event) => setMetricId(event.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={fieldStyle} disabled={areDefinitionsPending || definitions.length === 0}>
              {definitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.displayName || definition.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="block mb-1.5">{t.admin.modelField}</span>
            <select value={activeModelId} onChange={(event) => setModelId(event.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={fieldStyle} disabled={areModelsPending || models.length === 0}>
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="block mb-1.5">{t.admin.metricValueField}</span>
              <input type="number" step="any" value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={fieldStyle} required />
            </label>
            <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="block mb-1.5">{t.admin.obtainedAtField}</span>
              <input type="datetime-local" value={obtainedAt} onChange={(event) => setObtainedAt(event.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm" style={fieldStyle} />
            </label>
          </div>
        </div>

        {(definitions.length === 0 || models.length === 0) && !areDefinitionsPending && !areModelsPending && (
          <div role="status" className="text-xs mt-4 space-y-2" style={{ color: 'var(--warning)' }}>
            <p>{needsMetricAssignment ? t.admin.metricRequiredForResult
              : definitions.length === 0 ? t.admin.noMetricsForBenchmark : t.admin.noModelsForResult}</p>
            {needsMetricAssignment && (
              <Link to={ROUTES.ADMIN_EDIT(uploadTarget.id)} className="underline"
                onClick={() => setUploadTarget(null)}>
                {t.admin.editBenchmark}
              </Link>
            )}
          </div>
        )}

        {createResult.isError && (
          <p className="text-xs mt-4" style={{ color: 'var(--danger)' }}>
            {createResult.error.message || t.admin.uploadError}
          </p>
        )}

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={() => setUploadTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            {t.admin.cancel}
          </button>
          <button type="submit" disabled={!canSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ backgroundColor: 'var(--accent)' }}>
            {createResult.isPending ? t.catalogue.loading : t.admin.uploadBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
