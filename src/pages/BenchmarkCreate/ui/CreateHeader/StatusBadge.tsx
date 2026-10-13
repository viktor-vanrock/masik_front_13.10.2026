import { DialogueStatus } from '@/types';
import { MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { STATUS_CONFIG } from '../../consts';
import { useApp } from '@/hooks/useApp';

interface Props {
  status: DialogueStatus;
}

const STATUS_ICON: Record<DialogueStatus, React.ReactNode> = {
  [DialogueStatus.Interview]: <MessageSquare size={11} />,
  [DialogueStatus.InProgress]: <Clock size={11} />,
  [DialogueStatus.Done]: <CheckCircle2 size={11} />,
};

export const StatusBadge = ({ status }: Props) => {
  const { lang } = useApp();
  const cfg = STATUS_CONFIG[status];

  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
      style={{
        backgroundColor: `var(${cfg.bgVar})`,
        color: `var(${cfg.colorVar})`,
        border: '1px solid var(--border-strong)',
      }}
    >
      {STATUS_ICON[status]}
      {lang === 'ru' ? cfg.label.ru : cfg.label.en}
    </span>
  );
};
