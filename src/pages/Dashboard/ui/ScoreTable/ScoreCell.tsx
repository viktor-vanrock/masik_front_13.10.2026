interface Props {
  score: number | null | undefined;
  isBest: boolean;
  size?: 'normal' | 'small';
}

export const ScoreCell = ({ score, isBest, size = 'normal' }: Props) => {
  const className = size === 'small' ? 'text-xs font-medium' : 'font-semibold';
  
  if (score == null) {
    return <span style={{ color: 'var(--border-strong)' }}>—</span>;
  }

  return (
    <span
      className={className}
      style={{ color: isBest ? '#10b981' : 'var(--text-primary)' }}
    >
      {score.toFixed(1)}
      {isBest && ' ★'}
    </span>
  );
};