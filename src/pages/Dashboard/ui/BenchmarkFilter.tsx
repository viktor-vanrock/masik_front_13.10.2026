import type { BenchmarkType } from '@/types';
import type { DashboardSuite } from '@/pages/Dashboard/data/types';
import { allSuiteMembersSelected } from '../utils';
import { useApp } from '@/hooks/useApp';

interface Props {
  selectedBenchmarks: Set<string>;
  benchmarks: BenchmarkType[];
  benchmarkSuites: DashboardSuite[];
  bmMap: Map<string, BenchmarkType>;
  toggleBenchmark: (id: string) => void;
  toggleEntireSuite: (suite: DashboardSuite) => void;
}

export const BenchmarkFilter = ({
  selectedBenchmarks,
  benchmarks,
  benchmarkSuites,
  bmMap,
  toggleBenchmark,
  toggleEntireSuite,
}: Props) => {
  const { t, lang } = useApp();

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        {t.dashboard.benchmarkFilter}
      </p>
      <div className="space-y-4 max-h-[min(60vh,28rem)] overflow-y-auto pr-1">
        {/* Suites section */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
            {t.dashboard.suitesSection}
          </p>
          <div className="space-y-3">
            {benchmarkSuites.map((suite) => (
              <div key={suite.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleEntireSuite(suite)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left"
                  style={{
                    backgroundColor: allSuiteMembersSelected(suite, selectedBenchmarks)
                      ? 'var(--bg-blue-tint)'
                      : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: allSuiteMembersSelected(suite, selectedBenchmarks)
                        ? 'var(--accent)'
                        : 'var(--border-strong)',
                    }}
                  />
                  <span className="truncate flex-1">{lang === 'en' ? suite.nameEn : suite.name}</span>
                  <span className="text-[10px] font-normal flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {t.dashboard.selectEntireSuite}
                  </span>
                </button>
                {suite.testIds.map((id) => {
                  const b = bmMap.get(id);
                  if (!b) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleBenchmark(b.id)}
                      className="flex items-center gap-2 w-full pl-4 pr-2 py-1 rounded-lg text-xs transition-colors text-left"
                      style={{
                        backgroundColor: selectedBenchmarks.has(b.id) ? 'var(--bg-blue-tint)' : 'transparent',
                        color: selectedBenchmarks.has(b.id) ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: selectedBenchmarks.has(b.id) ? 'var(--accent)' : 'var(--border-strong)',
                        }}
                      />
                      <span className="truncate">{lang === 'en' ? b.nameEn : b.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-dim)' }}>
            {t.catalogue.otherBenchmarks}
          </p>
          <div className="space-y-1.5">
            {benchmarks.filter((b) => !b.suiteId).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBenchmark(b.id)}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left"
                style={{
                  backgroundColor: selectedBenchmarks.has(b.id) ? 'var(--bg-blue-tint)' : 'transparent',
                  color: selectedBenchmarks.has(b.id) ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: selectedBenchmarks.has(b.id) ? 'var(--accent)' : 'var(--border-strong)',
                  }}
                />
                <span className="truncate">{lang === 'en' ? b.nameEn : b.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
