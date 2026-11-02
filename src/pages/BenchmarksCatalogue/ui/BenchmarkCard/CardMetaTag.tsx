interface Props {
  icon: React.ReactNode;
  label?: string;
  plain?: boolean;
}
export const CardMetaTag = ({icon, label, plain}: Props) => {
  return (
    <span
      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
    >
      {icon}
      {!plain && label}
    </span>
  );
}