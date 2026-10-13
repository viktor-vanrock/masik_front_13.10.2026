interface Props {
  score: number;
}

export const HumanScoreBadge = ({ score }: Props) => (
  <span
    className="ml-2 text-[10px] px-1 py-0 rounded h-3"
    style={{
      backgroundColor: 'var(--human-badge-bg)',
      color: 'var(--human-pill-text)',
    }}
  >
    H {score.toFixed(0)}
  </span>
);