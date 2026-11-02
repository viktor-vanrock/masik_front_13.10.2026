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

  const statusClass = 'inline-flex w-fit items-center gap-1.5 rounded-full px-[10px] py-1 text-[12px] leading-[18px] font-semibold';
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

  return (
    <Link to={`/create?session=${encodeURIComponent(id)}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 rounded-[24px] border border-[#acb3cf33] bg-[#1d202f73] px-5 py-[18px] text-[#f2f3fc] no-underline transition-colors hover:border-[#6b73e88c] hover:bg-[#25283ab3]">
      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap items-center gap-[10px]"><span className="m-0 text-[18px] leading-6 font-semibold [overflow-wrap:anywhere]">{displayName}</span>
          <span className={`${statusClass} ${status === 'done' ? 'bg-[#1d302a] text-[#5de3bd]' : status === 'in-progress' ? 'bg-[#382d20] text-[#e0b978]' : 'bg-[#5865c92e] text-[#afb8ff]'}`}>{config.icon}{statusLabel}</span></div>
        <div className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[#8890ad]"><span>{t.profile.started}: {startDate}</span><span>{t.profile.updated}: {updatedDate}</span></div>
      </div>
      <ChevronRight size={16} className="text-[#8890ad]" />
    </Link>
  );
}
