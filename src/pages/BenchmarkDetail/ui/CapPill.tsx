import { Cpu } from 'lucide-react';

interface Props {
  label: string;
}

export function CapPill({ label }: Props) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
      style={{ backgroundColor: 'var(--bg-blue-tint)', color: 'var(--text-blue-on-bg)' }}
    >
      <Cpu size={11} />
      {label}
    </span>
  );
}