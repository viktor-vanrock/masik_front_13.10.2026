import type { Dialogue } from "@/types";
import { DISPLAY_STATUS_CONFIG } from "../../consts";
import type { DisplayStatus } from "@/types";
import { useApp } from "@/hooks/useApp";


interface Props {
  dialogue: Dialogue;
  displayStatus: DisplayStatus;
  isActive: boolean;
  onClick: () => void;
  isArchived?: boolean;
  onArchiveToggle?: () => void;
}

export const DialogueListItem = ({
  dialogue: d,
  displayStatus,
  isActive,
  onClick,
  isArchived = false,
  onArchiveToggle,
}: Props) => {
  const cfg = DISPLAY_STATUS_CONFIG[displayStatus];
  const { lang } = useApp();
  const statusColors = cfg.tone === 'green'
    ? { backgroundColor: '#e5f4ee', color: '#0c7055' }
    : cfg.tone === 'brand'
      ? { backgroundColor: '#eeeff7', color: '#3a427b' }
      : { backgroundColor: '#f3f6fa', color: '#686e78' };
  const name = lang === 'en' ? d.benchmarkNameEn : d.benchmarkName;
  const date = new Date(d.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <div className={`benchmark-create-chat-card${isActive ? ' is-active' : ''}${isArchived ? ' is-archived' : ''}`}>
      <button type="button" onClick={onClick} className="benchmark-create-chat-card__main">
        <strong>{name}</strong>
        <span className="benchmark-create-chat-card__status" style={{ ...statusColors }}>
          {lang === 'ru' ? cfg.label.ru : cfg.label.en}
        </span>
        <small>{date}</small>
      </button>
      {onArchiveToggle && isArchived && (
        <button
          type="button"
          className="benchmark-create-chat-card__archive"
          onClick={onArchiveToggle}
          aria-label="Вернуть чат из архива"
          title="Вернуть из архива"
        >
          Вернуть
        </button>
      )}
    </div>
  );
}
