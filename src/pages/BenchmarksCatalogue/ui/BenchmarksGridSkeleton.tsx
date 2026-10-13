import { useApp } from '@/hooks/useApp';

const SKELETON_COUNT = 6;

export function BenchmarksGridSkeleton() {
  const { t } = useApp();
  return (
    <div
      className="grid grid-cols-1 xl:grid-cols-2 gap-4"
      role="status"
      aria-label={t.common.aria.loadingCatalogue}
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className="h-48 rounded-xl animate-pulse"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
      ))}
    </div>
  );
}
