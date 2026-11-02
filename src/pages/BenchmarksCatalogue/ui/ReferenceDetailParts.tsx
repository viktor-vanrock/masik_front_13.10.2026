/* eslint-disable react-refresh/only-export-components */
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { ROUTES } from '@/routes/routes.constants';
import type { BenchmarkType } from '@/types';

export function ReferenceDetailFrame({ kind, children }: { kind: 'suite' | 'test'; children: ReactNode }) {
  return <div className="bf-theme bf-app"><div className="view" id={`v-${kind}`}><div className="view-bg" aria-hidden="true" /><div className="wrap">{children}</div></div></div>;
}

export function ReferenceCrumbs({ items }: { items: Array<{ label: string; to?: string }> }) {
  return <nav className="crumbs" aria-label="Навигационная цепочка">{items.map(({ label, to }, index) => <Fragment key={`${index}:${label}`}>{index > 0 && <ChevronRight aria-hidden="true" />}{to ? <Link to={to}>{label}</Link> : <span aria-current="page">{label}</span>}</Fragment>)}</nav>;
}

export function downloadReferenceJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name.replace(/[^\p{L}\p{N}._-]+/gu, '_') || 'benchmark'}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ReferenceActions({ suite = false, onDownload }: { suite?: boolean; onDownload: () => void }) {
  return <div className="actions"><button className="btn btn-primary" type="button" aria-disabled="true">Улучшить{suite ? ' набор' : ''} <ArrowRight className="lucide arr" aria-hidden="true" /></button><button className="icon-btn" style={{ width: 44, height: 44 }} type="button" data-dl="" aria-label="Скачать в JSON" title="Скачать в JSON" onClick={onDownload}><Download aria-hidden="true" /></button></div>;
}

export function normalizedReferenceText(text: string) {
  return text.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
}

export function firstReferenceParagraph(text: string) {
  return normalizedReferenceText(text).split(/\n+/)[0];
}

export function ReferenceParagraphs({ text }: { text: string }) {
  return <>{normalizedReferenceText(text).split(/\n+/).filter(paragraph => paragraph.trim()).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</>;
}

export function ReferenceClampedLead({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    let active = true;
    const measure = () => {
      const element = ref.current;
      if (active && element?.classList.contains('clamp')) setOverflows(element.scrollHeight > element.clientHeight + 2);
    };
    const frame = requestAnimationFrame(measure);
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => { active = false; cancelAnimationFrame(frame); window.removeEventListener('resize', measure); };
  }, [text]);
  return <><div className={`pg-lead${expanded ? '' : ' clamp'}`} ref={ref}>{text}</div>{overflows && <button className="more-btn" type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Свернуть' : 'Читать полностью'}</button>}</>;
}

export function referenceSources(tests: BenchmarkType[]) {
  const links = tests.flatMap(test => [
    ...test.references,
    ...test.links,
    ...(test.codebase?.url ? [{ title: test.codebase.name || 'Код и данные', url: test.codebase.url }] : []),
    ...(test.gigaMetricsCodebaseUrl ? [{ title: 'Код и данные', url: test.gigaMetricsCodebaseUrl }] : []),
    ...(test.gigaMetricSetUrl ? [{ title: 'Датасет', url: test.gigaMetricSetUrl }] : []),
  ]);
  const seen = new Set<string>();
  return links.filter(link => {
    if (seen.has(link.url)) return false;
    try {
      if (!['https:', 'http:'].includes(new URL(link.url).protocol)) return false;
    } catch { return false; }
    seen.add(link.url);
    return true;
  });
}

export function ReferenceSources({ links }: { links: Array<{ title: string; url: string }> }) {
  return <ul className="links">{links.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /><span>{link.title || link.url}<small>{new URL(link.url).hostname.replace(/^www\./, '')}</small></span></a></li>)}</ul>;
}

export function ReferenceDetailState({ kind, loading, onRetry }: { kind: 'suite' | 'test'; loading?: boolean; onRetry?: () => void }) {
  return <ReferenceDetailFrame kind={kind}><div className="empty" role={loading ? 'status' : 'alert'}><h3>{loading ? 'Загрузка…' : `Не удалось загрузить ${kind === 'suite' ? 'набор' : 'бенчмарк'}.`}</h3>{!loading && <div className="row"><Link className="btn btn-secondary" to={ROUTES.CATALOG}>Перейти в каталог</Link><button className="btn btn-primary" type="button" onClick={onRetry}>Повторить</button></div>}</div></ReferenceDetailFrame>;
}
