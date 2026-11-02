import { RecommendationCard } from './RecommendationCard';
import type { BenchmarkType, ChatMessage } from '@/types';
import { useApp } from '@/hooks/useApp';
import { ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import './MessageBubble.css';

interface Props {
  msg: ChatMessage;
  benchmarks: BenchmarkType[];
  recommendationDisabled?: boolean;
  onAcceptRecommendation?: (recommendationId: string) => void;
  onRejectRecommendation?: (recommendationId: string) => void;
  onConfirmGeneration?: () => void;
  onSendOption?: (id: string, label: string) => void;
  onSendText?: (text: string) => void;
  optionsDisabled?: boolean;
}

export function MessageBubble({ msg, benchmarks, recommendationDisabled, onAcceptRecommendation, onRejectRecommendation, onConfirmGeneration, onSendOption, onSendText, optionsDisabled }: Props) {
  const { t: { create } } = useApp();
  const isUser = msg.role === 'user';
  const derivedChange = isUser && msg.content.includes('ID исходного бенчмарка: ')
    ? msg.content.match(/Что изменить: ([\s\S]*?)(?:\n\nТест: |\n\nПример \d+ из |$)/)?.[1]?.trim() : undefined;
  const content = isUser && msg.content.startsWith('Масштабировать выбранные примеры:') ? 'Масштабировать выбранные примеры.' : derivedChange || msg.content;
  if (isUser) return <div className="m u"><div className="bubble">{content}</div></div>;
  const isSummary = msg.content.includes('Всё готово к подтверждению');
  const variants = msg.agentOptions?.map(option => ({ id: option.id, label: option.label, agent: true }))
    ?? msg.structuredPrompt?.options.map(option => ({ id: option.value, label: option.label, agent: false }))
    ?? msg.quickReplies?.map(label => ({ id: label, label, agent: false })) ?? [];
  const disabled = optionsDisabled ?? recommendationDisabled ?? false;
  const recommendations = (msg.recommendations ?? []).map(id => ({
    id,
    benchmark: benchmarks.find(test => test.id === id),
    recommendation: msg.recommendationItems?.find(item => item.testId === id),
  }));
  const actionProps = ({ recommendation }: typeof recommendations[number]) => ({
    recommendationId: recommendation?.id ?? (recommendations.length === 1 ? msg.pendingRecommendationId : undefined),
    recommendationStatus: recommendation?.status ?? (recommendations.length === 1 ? msg.recommendationStatus : undefined),
    onAccept: onAcceptRecommendation, onReject: onRejectRecommendation, disabled: recommendationDisabled,
  });
  return <div className="m a"><span className="ava" aria-hidden="true" /><div className="body">
    <Markdown components={{
      p: ({ children }) => {
        const text = (Array.isArray(children) ? children : [children]).filter(child => typeof child === 'string').join('');
        const exampleHint = text.startsWith('Например:');
        const greetingHint = text.startsWith('Опишите, что хотите проверить, — сначала поищу в каталоге');
        return <p className={exampleHint || greetingHint ? 'muted' : undefined} style={exampleHint ? { fontSize: 14 } : undefined}>{children}</p>;
      },
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      img: ({ alt }) => <span>{alt}</span>,
    }}>{content}</Markdown>
    {variants.length > 0 && <div className="chips">{variants.map((option, index) => {
      const label = option.label.trim();
      const improve = !option.agent && /^(улучшить|усилить|модифицировать|адаптировать|русифицировать)(?:\s|$)/i.test(label);
      const primary = index === 0 && /^(создать новый|создать свой)$/i.test(label);
      return <button className={`chip${primary ? ' pri' : ''}`} type="button" key={`${option.id}:${index}`} aria-disabled={improve ? 'true' : undefined} disabled={disabled || (!improve && !(option.agent ? onSendOption : onSendText))} onClick={() => { if (improve) return; if (option.agent) onSendOption?.(option.id, option.label); else onSendText?.(option.id); }}>{option.label}</button>;
    })}</div>}
    {isSummary && onConfirmGeneration && <div className="chips"><button className="btn btn-primary btn-sm" type="button" disabled={disabled} onClick={onConfirmGeneration}>Запустить генерацию <ArrowRight className="lucide arr" aria-hidden="true" /></button></div>}
    {recommendations.length > 0 && <div className="found">{recommendations.map(item => <RecommendationCard key={item.id}
      benchmark={item.benchmark ?? { id: item.id, name: item.id, nameEn: item.id, domains: [], taskType: null }}
      viewLabel={create.viewBenchmark} {...actionProps(item)} />)}</div>}
  </div></div>;
}
