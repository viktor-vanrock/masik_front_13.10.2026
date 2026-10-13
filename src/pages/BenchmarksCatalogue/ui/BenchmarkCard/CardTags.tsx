interface Props {
  items: string[];
  maxVisible?: number;
  color?: string;
  bg?: string;
}

export const CardTags = ({ items, maxVisible = 2, color = 'var(--text-muted)', bg = 'var(--bg-elevated)' }: Props) => {
  const visible = items.slice(0, maxVisible);
  const rest = items.length - maxVisible;
  return (
    <span className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <span
          key={item}
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: bg, color }}
        >
          {item}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{ backgroundColor: bg, color: 'var(--text-muted)' }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}