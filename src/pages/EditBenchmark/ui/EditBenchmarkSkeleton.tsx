export function EditBenchmarkSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header placeholder */}
        <div
          className="rounded-xl mb-6 animate-pulse"
          style={{
            height: 80,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl mb-4 animate-pulse"
            style={{
              height: 160,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
