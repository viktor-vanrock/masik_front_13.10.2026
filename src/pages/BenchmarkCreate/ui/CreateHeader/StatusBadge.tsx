import type { DisplayStatus } from '@/types';

export const StatusBadge = ({ status }: { status: DisplayStatus }) => {
  const states = {
    draft: ['Интервью', 's-interview'], summary: ['Интервью', 's-interview'],
    generating: ['Генерация', 's-gen'], samples: ['Проверка примеров', 's-review'],
    producing: ['Масштабирование', 's-gen'], ready: ['Готов', 's-ready'], submitted: ['На проверке', 's-review'],
  };
  const [label, className] = states[status];
  return <span id="chatStatus" className={`status ${className}`}>{label}</span>;
};
