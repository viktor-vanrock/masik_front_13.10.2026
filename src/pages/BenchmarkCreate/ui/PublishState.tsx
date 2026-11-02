import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import type { PublishStage } from '../consts';
import { useApp } from '@/hooks/useApp';
import { useSuiteOptionsQuery } from '@/api/catalog';

interface Props {
  stage: PublishStage;
  progress: number;
  publishedId: string;
  isPending: boolean;
  publishError: string | null;
  onPublish: (suiteId: string) => void;
}

export const PublishState = ({
  stage,
  progress,
  publishedId,
  isPending,
  publishError,
  onPublish,
}: Props) => {
  const { t, lang } = useApp();
  const { produce } = t.create;
  const [selectedSuiteId, setSelectedSuiteId] = useState('');
  const { data: suites } = useSuiteOptionsQuery();

  if (stage === 'submitted') {
    return (
      <div
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
        style={{
          backgroundColor: 'var(--status-done-bg)',
          border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)',
          color: 'var(--success)',
        }}
      >
        <CheckCircle2 size={16} />
        {produce.submittedBanner} ({publishedId})
      </div>
    );
  }

  if (stage === 'confirm') {
    return (
      <div className="space-y-3">
        {publishError && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-elevated)' }}>
            {publishError}
          </p>
        )}

        <div
          className="rounded-xl p-3 space-y-2"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          {[produce.warnRisk, produce.warnNoAcademic, produce.warnGenerated].map((warn) => (
            <div key={warn} className="flex items-start gap-2 text-xs" style={{ color: 'var(--warning)' }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{warn}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {t.benchmark.suiteIdLabel}
          </label>
          <select
            value={selectedSuiteId}
            onChange={(e) => setSelectedSuiteId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">{t.benchmark.suiteIdPlaceholder}</option>
            {(suites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {lang === 'en' ? s.nameEn : s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <a
            href="#"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onClick={(e) => e.preventDefault()}
          >
            <Download size={12} />
            {produce.downloadCsv}
          </a>
          <a
            href="#"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onClick={(e) => e.preventDefault()}
          >
            <Download size={12} />
            {produce.downloadJsonl}
          </a>
        </div>

        <button
          onClick={() => onPublish(selectedSuiteId)}
          disabled={!selectedSuiteId || isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--accent)',
            opacity: !selectedSuiteId || isPending ? 0.6 : 1,
            cursor: !selectedSuiteId || isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {produce.publishBtn}
        </button>
      </div>
    );
  }

  if (stage === 'producing') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center"
            style={{ backgroundColor: 'var(--status-done-bg)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)' }}
          >
            <CheckCircle2 size={12} />
            {produce.phaseInvention}
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center"
            style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            <Loader2 size={12} className="animate-spin" />
            {produce.phaseProduction}
          </div>
        </div>

        <div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 8, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-none"
              style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {produce.generating} {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
  }

  return null;
};
