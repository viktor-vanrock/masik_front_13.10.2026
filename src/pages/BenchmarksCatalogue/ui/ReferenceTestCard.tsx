/* eslint-disable react-refresh/only-export-components */
import { Link } from 'react-router-dom';
import type { BenchmarkType } from '@/types';

export const languageLabel = (name?: string) => {
  if (!name) return '';
  const key = name.trim().toLocaleLowerCase('ru');
  return ['русский', 'russian', 'ru', 'ru-ru', 'rus'].includes(key) ? 'RU'
    : ['английский', 'english', 'en', 'en-us', 'eng'].includes(key) ? 'EN' : name;
};

export function ReferenceTestTags({ test, max = 3 }: { test: BenchmarkType; max?: number }) {
  const tags: Array<{ text: string; className?: string }> = [];
  if (test.language?.name) tags.push({ text: languageLabel(test.language.name) });
  test.modalities.filter(({ name }) => !['текст', 'text'].includes(name.toLocaleLowerCase('ru'))).slice(0, 1).forEach(({ name }) => tags.push({ text: name }));
  test.metrics.slice(0, 1).forEach((text) => tags.push({ text, className: 'ink' }));
  if (['Приватный', 'К3', 'private', 'k3'].includes(test.confidentialityLevel ?? '')) tags.push({ text: ['К3', 'k3'].includes(test.confidentialityLevel!) ? 'К3' : 'Закрытый', className: 'lock' });
  return tags.slice(0, max + 1).map(({ text, className }) => <span key={text} className={`tag${className ? ` ${className}` : ''}`}>{text}</span>);
}

export function ReferenceTestCard({ test, from, mine = false }: { test: BenchmarkType; from?: string; mine?: boolean }) {
  const status = test.catalogEntry?.status ?? test.validationStatus;
  const pending = status === 'validation';
  const label = pending ? 'На проверке' : status === 'rejected' ? 'Отклонён' : '';
  return <Link className={`tc${pending ? ' draft' : ''}`} to={`/benchmark/${encodeURIComponent(test.id)}${mine ? '?submission=mine' : ''}`}>
    <div className="top">{label ? <span className={`tag ${pending ? 'warn' : 'bad'}`}>{label}</span> : test.difficulty?.name ? <span className="tag">{test.difficulty.name}</span> : null}{from && <span className="from">{from}</span>}</div>
    <h4>{test.name}</h4>
    <p>{(test.shortDescription || test.description || '').split(/\n+/)[0]}</p>
    <div className="foot"><ReferenceTestTags test={test} /></div>
  </Link>;
}
