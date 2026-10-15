interface Props {
  pointsCount?: number,
}

export const TypingIndicator = ({ pointsCount = 3 }: Props) => {
  return (
    <div className="flex w-full justify-start">
      <div className="flex w-fit max-w-[90%] flex-col gap-2 rounded-[20px] px-7 py-6 text-[13px] leading-[1.8] text-[#1e1e20] [overflow-wrap:anywhere] bg-[#f3f6fa] max-[600px]:rounded-2xl max-[600px]:p-5" role="status" aria-label="Печатает">
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
