import type { Dialogue } from "@/types";
import { STATUS_CONFIG } from "../../consts";
import { useApp } from "@/hooks/useApp";


interface Props {
  dialogue: Dialogue;
  isActive: boolean;
  onClick: () => void;
}

export const DialogueListItem = ({ dialogue: d, isActive, onClick }: Props) => {
  const cfg = STATUS_CONFIG[d.status];
  const { lang } = useApp();
  const name = lang === 'en' ? d.benchmarkNameEn : d.benchmarkName;
  const date = new Date(d.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
      style={{
        backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
        border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-sm font-medium truncate"
          style={{
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {name}
        </p>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `var(${cfg.bgVar})`,
            color: `var(${cfg.colorVar})`,
          }}
        >
          {lang === 'ru' ? cfg.label.ru : cfg.label.en}
        </span>
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
        {date}
      </p>
    </button>
  );
}