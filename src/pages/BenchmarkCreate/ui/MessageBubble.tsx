import { StructuredPromptBlock } from './StructuredPromptBlock';
import { RecommendationCard } from './RecommendationCard';
import { QuickReplyBar } from './QuickReplyBar';
import type { BenchmarkType, ChatMessage } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  msg: ChatMessage;
  benchmarks: BenchmarkType[];
  onQuickReply: (text: string) => void;
  quickReplyDisabled: boolean;
  recommendationDisabled?: boolean;
  onOptionSelect?: (id: string, label: string) => void;
  onAcceptRecommendation?: (recommendationId: string) => void;
  onRejectRecommendation?: (recommendationId: string) => void;
}

export const MessageBubble = ({
  msg,
  benchmarks,
  onQuickReply,
  quickReplyDisabled,
  recommendationDisabled,
  onOptionSelect,
  onAcceptRecommendation,
  onRejectRecommendation,
}: Props) => {
  const { t: { create } } = useApp();
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-3 mt-0.5"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
          }}
        >
          M
        </div>
      )}

      <div
        className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
          }`}
          style={{
            backgroundColor: isUser ? 'var(--accent)' : 'var(--bg-card)',
            color: isUser ? 'var(--white)' : 'var(--text-primary)',
            border: isUser ? 'none' : '1px solid var(--border)',
          }}
        >
          {msg.content}
        </div>

        {!isUser && msg.structuredPrompt && (
          <StructuredPromptBlock
            prompt={msg.structuredPrompt}
            interview={create.interview}
            onPick={onQuickReply}
            disabled={quickReplyDisabled}
          />
        )}

        {!isUser && msg.agentOptions && msg.agentOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.agentOptions.map((opt, i) => (
              <button
                key={opt.id || `opt-${i}`}
                type="button"
                disabled={quickReplyDisabled}
                onClick={() => onOptionSelect?.(opt.id, opt.label)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-blue-tint)',
                  color: 'var(--text-blue-on-bg)',
                  border: '1px solid var(--border)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
                  disabled={recommendationDisabled ?? quickReplyDisabled}
                />
              );
            })}
          </div>
        )}

        {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
          <QuickReplyBar
            labels={msg.quickReplies}
            onPick={onQuickReply}
            disabled={quickReplyDisabled}
          />
        )}
      </div>
    </div>
  );
};
