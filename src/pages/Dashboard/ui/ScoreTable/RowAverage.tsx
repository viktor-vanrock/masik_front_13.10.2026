import { calculateAverage } from "./utils";

interface Props {
  scores: number[];
  className?: string;
}

export const RowAverage = ({ scores, className = '' }: Props) => {
  const average = calculateAverage(scores);
  
  return (
    <td className={`py-3 px-3 text-left font-semibold ${className}`} style={{ color: 'var(--text-secondary)' }}>
      {average != null ? average.toFixed(1) : '—'}
    </td>
  );
};