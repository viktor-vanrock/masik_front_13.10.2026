import type { DisplayStatus } from '@/types';
import { DISPLAY_STATUS_CONFIG } from '../../consts';
import { useApp } from '@/hooks/useApp';

interface Props {
  status: DisplayStatus;
}

export const StatusBadge = ({ status }: Props) => {
  const { lang } = useApp();
  const cfg = DISPLAY_STATUS_CONFIG[status];
  const colors = cfg.tone === 'green'
    ? { backgroundColor: '#e5f4ee', color: '#0c7055' }
    : cfg.tone === 'brand'
      ? { backgroundColor: '#eeeff7', color: '#3a427b' }
      : { backgroundColor: '#f3f6fa', color: '#686e78' };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md flex-shrink-0 whitespace-nowrap"
      style={{
        ...colors,
        fontSize: '10px',
      }}
    >
      {lang === 'ru' ? cfg.label.ru : cfg.label.en}
    </span>
  );
};
