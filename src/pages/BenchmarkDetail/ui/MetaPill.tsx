interface Props {
  icon: React.ReactNode;
  label: string;
  plain?: boolean;
  highlight?: boolean;
}

export const MetaPill = ({ icon, label, plain, highlight }: Props) => {
  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
      style={{
        backgroundColor: highlight ? 'var(--human-pill-bg)' : 'var(--bg-elevated)',
        color: highlight ? 'var(--human-pill-text)' : 'var(--text-secondary)',
        border: highlight ? '1px solid var(--human-pill-border)' : undefined,
      }}
    >
      {icon}
      {!plain && label}
    </span>
  );
}