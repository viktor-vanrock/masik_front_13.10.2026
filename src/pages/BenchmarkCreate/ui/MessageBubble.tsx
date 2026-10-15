import { RecommendationCard } from './RecommendationCard';
import type { BenchmarkType, ChatMessage } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  msg: ChatMessage;
  benchmarks: BenchmarkType[];
  recommendationDisabled?: boolean;
  onAcceptRecommendation?: (recommendationId: string) => void;
  onRejectRecommendation?: (recommendationId: string) => void;
}

export const MessageBubble = ({
  msg,
  benchmarks,
  recommendationDisabled,
  onAcceptRecommendation,
  onRejectRecommendation,
}: Props) => {
  const { lang, t: { create } } = useApp();
  const isUser = msg.role === 'user';
  const variants = msg.agentOptions?.map((option) => option.label)
    ?? msg.structuredPrompt?.options.map((option) => option.label)
    ?? msg.quickReplies
    ?? [];

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-fit max-w-[90%] flex-col gap-2 rounded-[20px] text-[13px] leading-[1.8] [overflow-wrap:anywhere] max-[600px]:rounded-2xl max-[600px]:p-5 ${isUser ? 'bg-[#eeeff7] px-[22px] py-4 max-[600px]:px-[18px] max-[600px]:py-3.5 text-[#1e1e20]' : 'bg-[#f3f6fa] px-7 py-6 text-[#1e1e20]'}`}>
        <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
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
