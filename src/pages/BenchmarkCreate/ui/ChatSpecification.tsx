import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ConversationSpecification } from '@/api/conversations';

type Props = { mode?: string; sourceName?: string; specification?: ConversationSpecification };

function SpecificationRow({ label, value }: { label: string; value?: string }) {
  const valueRef = useRef<HTMLElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const element = valueRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (!expanded) setOverflows(element.scrollHeight > element.clientHeight + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded]);

  return <button className="spec-row" type="button" disabled={!overflows}
    aria-expanded={overflows ? expanded : undefined} onClick={() => setExpanded(!expanded)}>
    <span>{label}</span>
    <b ref={valueRef} className={value ? (typeof ResizeObserver !== 'undefined' ? 'spec-value' : undefined) : 'empty-v'}
      data-expanded={expanded || undefined}>{value || 'не задано'}</b>
    {overflows && <small className="spec-disclosure">{expanded ? 'Свернуть' : 'Показать полностью'}</small>}
  </button>;
}

export function ChatSpecification({ mode, sourceName, specification }: Props) {
  const scenario = specification?.scenario ?? mode;
  const rows: [string, string | undefined][] = [
    ['Сценарий', scenario === 'create' ? 'Создать новый' : scenario === 'modify' ? 'Улучшить существующий' : scenario === 'russify' ? 'Адаптировать на русский' : undefined],
    ...(sourceName ? [['Основа', sourceName] as [string, string]] : []),
    ['Что проверяем', specification?.goal], ['Домен', specification?.domain], ['Язык', specification?.language],
    ['Метрика', specification?.metric], ['Формат заданий', specification?.taskFormat], ['Название', specification?.name],
  ];
  const filled = rows.filter(([, value]) => value).length;
  return <aside className="cr-spec" aria-label="Спецификация бенчмарка">
    <h2>Спецификация <span id="specN">{filled}/{rows.length}</span></h2>
    <div className="spec-prog"><div className="prog"><i id="specBar" style={{ '--p': `${filled / rows.length * 100}%` } as CSSProperties} /></div></div>
    <div className="spec-list" id="specList">{rows.map(([label, value]) =>
      <SpecificationRow key={JSON.stringify([label, value])} label={label} value={value} />)}</div>
  </aside>;
}
