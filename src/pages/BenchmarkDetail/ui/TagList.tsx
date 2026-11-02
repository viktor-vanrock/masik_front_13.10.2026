interface Props {
  items: string[];
  color: string;
  bg: string;
}
export const TagList = ({ items, color, bg }: Props) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs px-2 py-0.5 rounded"
          style={{ backgroundColor: bg, color }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}