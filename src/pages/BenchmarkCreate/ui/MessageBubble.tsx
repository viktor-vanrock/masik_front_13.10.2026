import { RecommendationCard } from './RecommendationCard';
import type { BenchmarkType, ChatMessage } from '@/types';
import { useApp } from '@/hooks/useApp';
import { FileText } from 'lucide-react';

interface Props {
  msg: ChatMessage;
  benchmarks: BenchmarkType[];
  recommendationDisabled?: boolean;
  onAcceptRecommendation?: (recommendationId: string) => void;
  onRejectRecommendation?: (recommendationId: string) => void;
  onConfirmGeneration?: () => void;
}

export const MessageBubble = ({
  msg,
  benchmarks,
  recommendationDisabled,
  onAcceptRecommendation,
  onRejectRecommendation,
  onConfirmGeneration,
}: Props) => {
  const { lang, t: { create } } = useApp();
  const isUser = msg.role === 'user';
  const derivedChange = isUser && msg.content.includes('ID исходного бенчмарка: ')
    ? msg.content.match(/Что изменить: ([\s\S]*?)(?:\n\nТест: |\n\nПример \d+ из |$)/)?.[1]?.trim()
    : undefined;
  const displayContent = isUser && msg.content.startsWith('Масштабировать выбранные примеры:')
    ? 'Масштабировать выбранные примеры.' : derivedChange || msg.content;
  const summaryLines = !isUser && msg.content.includes('Всё готово к подтверждению')
    ? msg.content.split('\n').map((line) => line.trim()).filter(Boolean)
    : [];
  const isSummary = summaryLines.length > 0;
  const variants = msg.agentOptions?.map((option) => option.label)
    ?? msg.structuredPrompt?.options.map((option) => option.label)
    ?? msg.quickReplies
    ?? [];

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-fit max-w-[90%] flex-col gap-2 rounded-[20px] text-[13px] leading-[1.8] [overflow-wrap:anywhere] max-[600px]:rounded-2xl max-[600px]:p-5 ${isUser ? 'bg-[#eeeff7] px-[22px] py-4 max-[600px]:px-[18px] max-[600px]:py-3.5 text-[#1e1e20]' : 'bg-[#f3f6fa] px-7 py-6 text-[#1e1e20]'}`}>
        {isSummary ? <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3 text-[18px] leading-[1.4] text-[#1e1e20]"><FileText size={20} className="shrink-0 text-[#515dad]" /><strong className="font-medium">Всё готово к подтверждению</strong></div>
          <p className="m-0 text-[12px] text-[#686e78]">Проверьте требования:</p>
          <ol className="my-5 list-decimal pl-[22px] text-[11px] leading-[1.7] marker:text-[#515dad]">
            {summaryLines.filter((line) => !line.includes('Всё готово к подтверждению') && line !== 'Проверьте требования:').map((line, index) => {
              const divider = line.indexOf(':');
              return <li key={`${index}-${line}`} className="border-b border-[#e9edf2] py-[9px] last:border-b-0">
                {divider < 0 ? line : <><strong className="font-medium">{line.slice(0, divider + 1)}</strong>{line.slice(divider + 1)}</>}
              </li>;
            })}
          </ol>
          {onConfirmGeneration && <div className="flex flex-col items-start gap-3 border-t border-[#e9edf2] pt-6">
            <button type="button" onClick={onConfirmGeneration} className="inline-flex cursor-pointer items-center justify-center gap-[10px] rounded-[30px] border border-[#3a427b] bg-[#515dad] px-5 py-3 text-[13px] font-[450] leading-5 text-white transition hover:bg-[#465195]">Начать генерацию<svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"><path d="m9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg></button>
            <small className="text-[10px] leading-[1.5] text-[#686e78]">Если хотите что-то изменить или уточнить, просто напишите в чат.</small>
          </div>}
        </div> : <p className="m-0 whitespace-pre-wrap">{displayContent}</p>}
        {!isUser && variants.length > 0 && (
          <p className="m-0 text-[13px] leading-[1.6] text-[#1e1e20]">
            <strong>{lang === 'ru' ? 'Варианты:' : 'Options:'}</strong>{' '}
            {variants.join(' · ')}
          </p>
        )}

        {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
          <div className="flex flex-col gap-2 w-full min-w-[200px]">
            {msg.recommendations.map((id) => {
              const b = benchmarks.find((x) => x.id === id);
              const recommendation = msg.recommendationItems?.find((item) => item.testId === id);
              return (
                <RecommendationCard
                  key={id}
                  benchmark={b ?? {
                    id, name: id, nameEn: id,
                    domains: [], taskType: null,
                  }}
                  viewLabel={create.viewBenchmark}
                  recommendationId={recommendation?.id ?? (msg.recommendations?.length === 1
                    ? msg.pendingRecommendationId : undefined)}
                  recommendationStatus={recommendation?.status ?? (msg.recommendations?.length === 1
                    ? msg.recommendationStatus : undefined)}
                  onAccept={onAcceptRecommendation}
                  onReject={onRejectRecommendation}
                  disabled={recommendationDisabled ?? false}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
