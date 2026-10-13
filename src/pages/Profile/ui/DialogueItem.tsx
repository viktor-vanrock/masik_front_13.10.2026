import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';
import type { Dialogue } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  dialogue: Dialogue;
}

export const DialogueItem = ({ dialogue }: Props) => {
  const { t, lang } = useApp();
  const { id, status, conversationStatus, benchmarkName, benchmarkNameEn, startedAt, updatedAt } = dialogue;

  const config = STATUS_CONFIG[status];
  const displayName = lang === 'en' ? benchmarkNameEn : benchmarkName;
  const statusLabel = conversationStatus === 'generating' ? t.profile.generation
    : conversationStatus === 'awaiting_choice' ? t.profile.awaitingChoice
      : conversationStatus === 'abandoned' ? t.profile.closed
        : lang === 'ru' ? config.label.ru : config.label.en;
  const startDate = new Date(startedAt).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US'
  );

  const updatedDate = new Date(updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const element = e.currentTarget;
    element.style.borderColor = 'var(--accent)';
    element.style.backgroundColor = 'var(--bg-card-hover)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const element = e.currentTarget;
    element.style.borderColor = 'var(--border)';
    element.style.backgroundColor = 'var(--bg-card)';
  };

  return (
    <Link
      to={`/create?session=${encodeURIComponent(id)}`}
      className="flex items-center gap-4 p-4 rounded-xl transition-all"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.bg }}
      >
        <span style={{ color: config.color }}>{config.icon}</span>
      </div>

      {/* Dialogue Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {displayName}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.profile.started}: {startDate}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.profile.updated}: {updatedDate}
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            backgroundColor: config.bg,
            color: config.color,
            border: `1px solid ${config.color}44`,
          }}
        >
          {config.icon}
          {statusLabel}
        </span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
    </Link>
  );
}