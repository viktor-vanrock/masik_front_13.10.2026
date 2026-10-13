interface Props {
  pointsCount?: number,
}

export const TypingIndicator = ({ pointsCount = 3 }: Props) => {
  return (
    <div className="flex items-end gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
        }}
      >
        M
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-1">
          {Array.from({ length: pointsCount }, (_, idx) => (
            <div
              key={`dot-${idx}`}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: 'var(--accent)',
                animation: `bounce 1.2s ease-in-out ${idx * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}