import { Activity } from 'lucide-react';
import {
  ANALYTICS_EVENT_TYPES,
  type AnalyticsEvent,
  type AnalyticsEventType,
} from '@/api/analytics';
import { useApp } from '@/hooks/useApp';
import { shortHash } from './utils';

interface Props {
  events: AnalyticsEvent[];
  total: number;
  selectedType: AnalyticsEventType | '';
  isLoading: boolean;
  onTypeChange: (type: AnalyticsEventType | '') => void;
}

export function AnalyticsEventsTable({
  events,
  total,
  selectedType,
  isLoading,
  onTypeChange,
}: Props) {
  const { t, lang } = useApp();

  const typeLabels: Record<AnalyticsEventType, string> = {
    [ANALYTICS_EVENT_TYPES.benchmarkView]: t.admin.analytics.eventBenchmarkView,
    [ANALYTICS_EVENT_TYPES.benchmarkTestView]: t.admin.analytics.eventBenchmarkTestView,
    [ANALYTICS_EVENT_TYPES.catalogSearch]: t.admin.analytics.eventCatalogSearch,
    [ANALYTICS_EVENT_TYPES.filterUsage]: t.admin.analytics.eventFilterUsage,
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const getObjectName = (event: AnalyticsEvent): string => {
    if (event.benchmarkTest) {
      return lang === 'en'
        ? event.benchmarkTest.nameEn || event.benchmarkTest.name
        : event.benchmarkTest.name || event.benchmarkTest.nameEn;
    }
    if (event.benchmark) {
      return lang === 'en'
        ? event.benchmark.nameEn || event.benchmark.name
        : event.benchmark.name || event.benchmark.nameEn;
    }
    if (event.type === ANALYTICS_EVENT_TYPES.catalogSearch) {
      const search = event.metadata?.search;
      return typeof search === 'string' ? search : '—';
    }
    return '—';
  };

  return (
    <section
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--accent)' }}
          >
            <Activity size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t.admin.analytics.eventsTitle}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {t.admin.analytics.eventsTotal.replace('{count}', total.toLocaleString())}
            </p>
          </div>
        </div>

        <select
          value={selectedType}
          onChange={(event) => onTypeChange(event.target.value as AnalyticsEventType | '')}
          className="px-3 py-2 rounded-lg text-xs outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <option value="">{t.admin.analytics.allEvents}</option>
          {Object.entries(typeLabels).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto" style={{ borderTop: '1px solid var(--border)' }}>
        <table className="w-full min-w-[760px] text-left">
          <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <tr>
              {[t.admin.analytics.colDate, t.admin.analytics.colEvent, t.admin.analytics.colObject, t.admin.analytics.colSession].map((label) => (
                <th
                  key={label}
                  className="px-4 py-2.5 text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} style={{ borderTop: '1px solid var(--border)' }}>
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-5 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                  </td>
                </tr>
              ))
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                  {t.admin.analytics.noData}
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(event.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--text-blue-on-bg)' }}
                    >
                      {typeLabels[event.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[320px] truncate" style={{ color: 'var(--text-primary)' }}>
                    {getObjectName(event)}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {shortHash(event.sessionIdHash)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
