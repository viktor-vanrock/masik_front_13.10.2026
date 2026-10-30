import { Pin } from 'lucide-react';
import type { Dialogue } from "@/types";
import { DISPLAY_STATUS_CONFIG } from "../../consts";
import type { DisplayStatus } from "@/types";
import { useApp } from "@/hooks/useApp";

interface Props {
  dialogue: Dialogue;
  displayStatus: DisplayStatus;
  isActive: boolean;
  onClick: () => void;
  onTogglePin: () => void;
  isArchived?: boolean;
}

export const DialogueListItem = ({
  dialogue: d,
  displayStatus,
  isActive,
  onClick,
  onTogglePin,
  isArchived = false,
}: Props) => {
  const cfg = DISPLAY_STATUS_CONFIG[displayStatus];
  const { lang, t } = useApp();
  const pinLabel = d.pinnedDate ? t.create.unpinChat : t.create.pinChat;
  const statusColors = cfg.tone === 'green'
    ? { backgroundColor: '#e5f4ee', color: '#0c7055' }
    : cfg.tone === 'brand'
      ? { backgroundColor: '#eeeff7', color: '#3a427b' }
      : { backgroundColor: '#f3f6fa', color: '#686e78' };
  const name = lang === 'en' ? d.benchmarkNameEn : d.benchmarkName;
  const date = new Date(d.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <div
      className={[
        'group relative flex items-start gap-1 border rounded-xl transition-colors duration-150',
        isActive ? 'border-[#afb4d9] bg-[#eeeff7]' : 'border-transparent hover:bg-[#f3f6fa]',
        isArchived ? 'bg-[#fcfcfd]' : '',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 flex-col items-start border-0 p-3.5 bg-transparent text-inherit text-left cursor-pointer"
      >
        <strong className="block max-w-full mb-2 text-sm font-medium leading-[1.6] text-[#1e1e20] [overflow-wrap:anywhere]">
          {name}
        </strong>
        <span
          className="inline-flex max-w-full items-center rounded-md px-2 py-1 text-xs leading-[1.4] whitespace-normal"
          style={statusColors}
        >
          {lang === 'ru' ? cfg.label.ru : cfg.label.en}
        </span>
        <small className="block mt-2 text-xs text-[#686e78]">{date}</small>
      </button>
      {d.conversationId && <button
        type="button"
        onClick={onTogglePin}
        aria-label={pinLabel}
        title={pinLabel}
        aria-pressed={Boolean(d.pinnedDate)}
        className={[
          'm-2 p-1.5 rounded-md border-0 bg-transparent text-[#515dad] cursor-pointer hover:bg-[#eeeff7]',
          d.pinnedDate ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
        ].join(' ')}
      ><Pin size={16} fill={d.pinnedDate ? 'currentColor' : 'none'} /></button>}
    </div>
  );
};
