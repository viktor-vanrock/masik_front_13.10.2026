import { Link } from 'react-router-dom';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

export interface AnalyticsRankingItem {
  id: string;
  name: string;
  subtitle?: string;
  views: number;
  href?: string;
}

interface Props {
  title: string;
  subtitle: string;
  items: AnalyticsRankingItem[];
  isLoading: boolean;
}

export function AnalyticsRankingTable({
  title,
  subtitle,
  items,
  isLoading,
}: Props) {
  const { t } = useApp();
  const maxViews = Math.max(...items.map((item) => item.views), 1);

  return (
    <section
      className="rounded-xl p-4 min-w-0"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--accent)' }}
        >
          <Trophy size={15} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-12 rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="py-10 text-center text-sm rounded-lg"
          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
        >
          {t.admin.analytics.noData}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const content = (
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-6 text-center text-xs font-semibold flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {item.views.toLocaleString()}
                      </span>
                      {item.href && <ArrowUpRight size={13} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>
                  <div
                    className="h-1 rounded-full mt-2 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max((item.views / maxViews) * 100, 2)}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              </div>
            );

            return item.href ? (
              <Link
                key={item.id}
                to={item.href}
                className="block rounded-lg p-2 transition-colors"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                className="rounded-lg p-2"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
