import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/hooks/useApp';

export interface ContactRequestItem {
  publicNumber: string;
  chatId: string;
  chatTitle: string | null;
  chatAvailable: boolean;
  fullName: string;
  email: string;
  consent: boolean;
  consentAt: string;
  consentVersion: string;
  createdAt: string;
  requirements: Record<string, string> | null;
}

interface Props {
  items: ContactRequestItem[];
  isPending: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

const labels = {
  ru: {
    title: 'Контактные заявки', empty: 'Контактных заявок пока нет.', loadError: 'Не удалось загрузить контактные заявки.',
    retry: 'Повторить', more: 'Загрузить ещё', loading: 'Загрузка…', name: 'ФИО', email: 'Email', date: 'Получена',
    consent: 'Согласие', accepted: 'Получено', missing: 'Нет', version: 'Версия согласия', chat: 'Чат',
    openChat: 'Открыть чат', unavailable: 'Чат доступен его владельцу', details: 'Требования к бенчмарку', noDetails: 'Требования не сохранены в этой заявке.',
    goal: 'Цель', scope: 'Предметная область', input_format: 'Вход', output_format: 'Ответ', language: 'Язык',
    difficulty: 'Сложность', evaluation: 'Оценка', task_count: 'Число заданий',
  },
  en: {
    title: 'Contact requests', empty: 'No contact requests yet.', loadError: 'Could not load contact requests.',
    retry: 'Retry', more: 'Load more', loading: 'Loading…', name: 'Full name', email: 'Email', date: 'Received',
    consent: 'Consent', accepted: 'Received', missing: 'No', version: 'Consent version', chat: 'Chat',
    openChat: 'Open chat', unavailable: 'Chat is available to its owner', details: 'Benchmark requirements', noDetails: 'Requirements were not saved with this request.',
    goal: 'Goal', scope: 'Subject area', input_format: 'Input', output_format: 'Output', language: 'Language',
    difficulty: 'Difficulty', evaluation: 'Evaluation', task_count: 'Number of tasks',
  },
} as const;
const requirementKeys = ['goal', 'scope', 'input_format', 'output_format', 'language', 'difficulty', 'evaluation', 'task_count'] as const;

export function ContactRequestsSection({ items, isPending, isError, isFetchingNextPage, hasNextPage, onLoadMore, onRetry }: Props) {
  const { lang } = useApp();
  const text = labels[lang === 'en' ? 'en' : 'ru'];
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetchingNextPage || isError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) onLoadMore();
    }, { rootMargin: '200px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, onLoadMore]);
  const date = (value: string) => new Date(value).toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU');
  return (
    <section className="mt-14 grid gap-[18px] max-[700px]:mt-10" aria-labelledby="contact-requests-title">
      <h2 id="contact-requests-title" className="m-0 text-[24px] leading-[1.2] font-medium tracking-[-.01em]">{text.title}</h2>
      {isPending && <p className="text-[14px] text-[#acb3cf]" role="status">{text.loading}</p>}
      {!isPending && !isError && items.length === 0 && <p className="grid justify-items-center gap-[14px] rounded-[24px] border border-dashed border-[#acb3cf33] px-6 py-9 text-center text-[14px] text-[#acb3cf]">{text.empty}</p>}
      {items.map(item => (
        <article className="grid gap-4 rounded-[24px] border border-[#acb3cf33] bg-[#1d202f73] p-5" key={item.publicNumber}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 [&_h3]:m-0 [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:[overflow-wrap:anywhere] [&_time]:text-[13px] [&_time]:text-[#8890ad]"><h3>{item.publicNumber}</h3><time dateTime={item.createdAt}>{date(item.createdAt)}</time></div>
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-6 gap-y-3 [&_dt]:text-[12px] [&_dt]:text-[#8890ad] [&_dd]:mt-0.5 [&_dd]:ml-0 [&_dd]:text-[14px] [&_dd]:text-[#f2f3fc] [&_dd]:[overflow-wrap:anywhere]">
            <div><dt>{text.name}</dt><dd>{item.fullName}</dd></div>
            <div><dt>{text.email}</dt><dd>{item.email}</dd></div>
            <div><dt>{text.consent}</dt><dd>{item.consent ? `${text.accepted} · ${date(item.consentAt)}` : text.missing}</dd></div>
            <div><dt>{text.version}</dt><dd>{item.consentVersion}</dd></div>
            <div><dt>{text.chat}</dt><dd>{item.chatTitle ? `${item.chatTitle} · ${item.chatId}` : item.chatId}</dd></div>
          </dl>
          {item.chatAvailable ? <Link className="w-fit text-[14px] font-semibold text-[#afb8ff] underline underline-offset-[3px]" to={`/create?session=${encodeURIComponent(item.chatId)}`}>{text.openChat}</Link> : <p className="text-[14px] text-[#acb3cf]">{text.unavailable}</p>}
          <details className="border-t border-[#acb3cf33] pt-3 [&_summary]:cursor-pointer [&_summary]:text-[14px] [&_summary]:font-semibold [&_summary]:text-[#acb3cf] [&_dl]:mt-3 [&_p]:mt-3"><summary>{text.details}</summary>
            {item.requirements ? <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-6 gap-y-3 [&_dt]:text-[12px] [&_dt]:text-[#8890ad] [&_dd]:mt-0.5 [&_dd]:ml-0 [&_dd]:text-[14px] [&_dd]:text-[#f2f3fc] [&_dd]:[overflow-wrap:anywhere]">{requirementKeys.filter(key => item.requirements?.[key]).map(key => <div key={key}><dt>{text[key]}</dt><dd>{item.requirements?.[key]}</dd></div>)}</dl> : <p className="text-[14px] text-[#acb3cf]">{text.noDetails}</p>}
          </details>
        </article>
      ))}
      {isError && <div className="text-[14px] text-[#ff91a0]" role="alert"><p>{text.loadError}</p><button type="button" className="underline" onClick={onRetry}>{text.retry}</button></div>}
      {hasNextPage && <div ref={sentinel} className="flex justify-center"><button type="button" className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-[14px] text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 border-[#ffffff1a] bg-[#ffffff14] text-[#f2f3fc] hover:not-disabled:bg-[#ffffff1f]" disabled={isFetchingNextPage} onClick={onLoadMore}>{isFetchingNextPage ? text.loading : text.more}</button></div>}
    </section>
  );
}
