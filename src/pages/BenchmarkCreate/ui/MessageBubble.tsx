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
    <div className={`benchmark-chat-message-row ${isUser ? 'is-user' : 'is-assistant'}`}>
      <div className={`benchmark-chat-message ${isUser ? 'is-user' : 'is-assistant'}`}>
        <p>{msg.content}</p>
        {!isUser && variants.length > 0 && (
          <p className="benchmark-chat-message__variants">
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
