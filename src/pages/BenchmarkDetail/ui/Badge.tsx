interface Props {
  children: React.ReactNode;
  color: string;
}

export function Badge({ 
  children,
  color,
}: Props) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-0.5 rounded-full"
      style={{ border: '1px solid', borderColor: color, color }}
    >
      {children}
    </span>
  );
}
