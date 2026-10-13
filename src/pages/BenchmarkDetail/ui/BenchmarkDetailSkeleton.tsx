export function BenchmarkDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HeaderCard placeholder */}
        <div
          className="rounded-xl mb-6 animate-pulse"
          style={{
            height: 160,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
        {/* Tabs nav placeholder */}
        <div
          className="rounded-xl mb-6 animate-pulse"
          style={{
            height: 48,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
        {/* Content placeholder */}
        <div
          className="rounded-xl animate-pulse"
          style={{
            height: 500,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
      </div>
    </div>
  );
}
