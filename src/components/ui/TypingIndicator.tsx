interface Props {
  pointsCount?: number,
}

export const TypingIndicator = ({ pointsCount = 3 }: Props) => {
  return (
    <div className="benchmark-chat-message-row is-assistant">
      <div className="benchmark-chat-message is-assistant" role="status" aria-label="Печатает">
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
