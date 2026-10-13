import { useApp } from '@/hooks/useApp';
import type { BenchmarkType, BenchmarkLinkItem } from '@/types';
import {
  ExternalLink,
  Code2,
  BookOpen,
  Link2,
  Cloud,
  GitBranch,
  GitFork,
  FileText,
  Database,
  BarChart3,
  LineChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  benchmark: BenchmarkType;
}

const LINK_TYPE_ICON: Record<BenchmarkLinkItem['type'], LucideIcon> = {
  obs: Cloud,
  gitverse: GitBranch,
  github: GitFork,
  docs: FileText,
  dataset: Database,
  score_racoon: BarChart3,
  giga_metrics: LineChart,
  other: Link2,
};

export function ReferencesTab({ benchmark }: Props) {
  const { t } = useApp();
  const { codebase, references, links } = benchmark;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
          {t.benchmark.codebaseLabel}
        </h2>
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <Code2 size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
              {t.benchmark.codebaseLabel}
            </p>
            <a
              href={codebase.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium flex items-center gap-1.5 hover:underline"
              style={{ color: 'var(--text-blue-on-bg)' }}
            >
              {codebase.name}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {references.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
            {t.benchmark.references}
          </h2>
          <div className="space-y-3">
            {references.map((ref, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <BookOpen size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {t.benchmark.paperLabel}
                  </p>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium flex items-start gap-1.5 hover:underline leading-snug"
                    style={{ color: 'var(--text-blue-on-bg)' }}
                  >
                    {ref.title}
                    <ExternalLink size={12} className="flex-shrink-0 mt-0.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-primary)' }}>
            {t.benchmark.linksLabel}
          </h2>
          <div className="space-y-3">
            {links.map((link, i) => {
              const Icon = LINK_TYPE_ICON[link.type] ?? Link2;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <Icon size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p
                      className="text-xs mb-1 uppercase tracking-wider"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.type}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium flex items-start gap-1.5 hover:underline leading-snug"
                      style={{ color: 'var(--text-blue-on-bg)' }}
                    >
                      {link.title}
                      <ExternalLink size={12} className="flex-shrink-0 mt-0.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
