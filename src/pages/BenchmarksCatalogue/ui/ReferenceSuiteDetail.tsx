import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useBenchmarkGroupsQuery, useSuiteQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { selectBenchmarkExamples } from '@/features/catalog/selectors';
import type { BenchmarkSuite, BenchmarkType } from '@/types';
import { ROUTES } from '@/routes/routes.constants';
import { dictionaryNames, displayDictionaryName, pluralRu } from '../utils';
import { ReferenceActions, ReferenceClampedLead, ReferenceCrumbs, ReferenceDetailFrame, ReferenceDetailState, ReferenceParagraphs, ReferenceSources, downloadReferenceJson, firstReferenceParagraph, referenceSources } from './ReferenceDetailParts';

export function ReferenceSuiteDetail() {
  const { id } = useParams<{ id: string }>();
  const suite = useSuiteQuery({ id });
  const groups = useBenchmarkGroupsQuery({ suiteIds: id ? [id] : undefined }, { enabled: Boolean(id), pageSize: 100, loadAllPages: true });
  const tests = groups.data?.pages.flatMap(page => page.data).filter(group => group.benchmark.id === id).flatMap(group => group.tests) ?? [];
  if (suite.isError || groups.isError) return <ReferenceDetailState kind="suite" onRetry={() => { void suite.refetch(); void groups.refetch(); }} />;
  if (suite.isPending || groups.isPending || groups.isPlaceholderData || groups.hasNextPage) return <ReferenceDetailState kind="suite" loading />;
  return <SuiteContent key={suite.data.id} suite={suite.data} tests={tests} />;
}

function SuiteContent({ suite, tests }: { suite: BenchmarkSuite; tests: BenchmarkType[] }) {
  const { lang } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'composition' | 'about'>('composition');
  const [selectedId, setSelectedId] = useState(tests[0]?.id);
  const [search, setSearch] = useState('');
  const selected = tests.find(test => test.id === selectedId) ?? tests[0];
  const name = displayDictionaryName(suite, lang);
  const description = (lang === 'en' ? suite.descriptionEn || suite.description : suite.description) || '';
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
  const facts = [
    ['Тестов', suite.benchmarkTestsCount > tests.length ? `${tests.length} из ${suite.benchmarkTestsCount}` : String(tests.length)],
    ['Язык', unique(tests.map(test => displayDictionaryName(test.language, lang))).join(', ')],
    ['Модальность', unique(tests.flatMap(test => dictionaryNames(test.modalities, lang))).join(', ')],
    ['Доступ', unique(tests.map(test => test.confidentialityLevel || '')).join(', ')],
  ].filter(([, value]) => value);
  const metrics = unique(tests.flatMap(test => test.metrics));
  const domains = unique(tests.flatMap(test => dictionaryNames(test.domains, lang)));
  const sources = referenceSources(tests);
  const visibleIds = useMemo(() => {
    const words = search.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
    return new Set(tests.filter(test => {
      const text = [test.name, test.nameEn, test.description, test.descriptionEn, test.shortDescription, ...test.metrics, ...dictionaryNames(test.domains, lang)].join(' ').toLocaleLowerCase('ru');
      return words.every(word => text.includes(word));
    }).map(test => test.id));
  }, [tests, search, lang]);
  const selectTest = (test: BenchmarkType) => {
    if (matchMedia('(max-width: 980px)').matches) navigate(ROUTES.BENCHMARK(encodeURIComponent(test.id)));
    else setSelectedId(test.id);
  };
  const moveTest = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]:not([hidden])')];
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next = options[Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))];
    next?.focus(); next?.click();
  };
  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = tab === 'composition' ? 'about' : 'composition';
    setTab(next);
    document.getElementById(next === 'composition' ? 'tb-c' : 'tb-a')?.focus();
  };
  return <ReferenceDetailFrame kind="suite">
    <ReferenceCrumbs items={[{ label: 'Каталог', to: ROUTES.CATALOG }, { label: name }]} />
    <div className="pg-top"><div className="pg-head"><span className="overline">Набор бенчмарков</span><h1 className="pg-title">{name}</h1><ReferenceClampedLead text={firstReferenceParagraph(description)} /></div><ReferenceActions suite onDownload={() => downloadReferenceJson(name, { ...suite, tests, exportNote: 'Метаданные и доступные примеры. Полный внешний датасет не включён.' })} /></div>
    <dl className="facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="su-tabs" role="tablist" aria-label="Разделы набора"><button className="tab" role="tab" id="tb-c" aria-controls="pn-c" aria-selected={tab === 'composition'} tabIndex={tab === 'composition' ? 0 : -1} onClick={() => setTab('composition')} onKeyDown={changeTab}>Состав · {tests.length}</button><button className="tab" role="tab" id="tb-a" aria-controls="pn-a" aria-selected={tab === 'about'} tabIndex={tab === 'about' ? 0 : -1} onClick={() => setTab('about')} onKeyDown={changeTab}>О наборе</button></div>
    <div className="su-pane" role="tabpanel" id="pn-c" aria-labelledby="tb-c" hidden={tab !== 'composition'}><div className="md"><div className="md-list" role="listbox" aria-label="Тесты набора" onKeyDown={moveTest}>{tests.length > 8 && <label className="search"><span className="sr-only">Найти тест</span><Search aria-hidden="true" /><input className="input" type="search" id="mdQ" placeholder="Найти тест" value={search} onChange={event => setSearch(event.target.value)} /></label>}{tests.map(test => <button className="md-item" type="button" role="option" key={test.id} data-id={test.id} aria-selected={test.id === selected?.id} hidden={!visibleIds.has(test.id)} onClick={() => selectTest(test)}><b>{displayDictionaryName(test, lang)}</b><span>{[displayDictionaryName(test.language, lang), test.metrics[0]].filter(Boolean).join(' · ')}</span></button>)}{!tests.length && <p className="note">В наборе нет доступных тестов.</p>}</div><div className="md-view" id="mdV" aria-live="polite">{selected && <SuiteTestSummary test={selected} />}</div></div>{suite.benchmarkTestsCount > tests.length && <p className="note" style={{ marginTop: 16 }}>Доступно {tests.length} из {suite.benchmarkTestsCount} тестов набора.</p>}</div>
    <div className="su-pane" role="tabpanel" id="pn-a" aria-labelledby="tb-a" hidden={tab !== 'about'}><div className="about"><div className="prose"><ReferenceParagraphs text={description} /></div><aside style={{ display: 'grid', gap: 12 }}>{metrics.length > 0 && <section className="side-card"><h3>Метрики</h3><div className="tagset">{metrics.map(metric => <span className="tag ink" key={metric}>{metric}</span>)}</div></section>}{domains.length > 0 && <section className="side-card"><h3>Домены</h3><div className="tagset">{domains.map(domain => <span className="tag" key={domain}>{domain}</span>)}</div></section>}{sources.length > 0 && <section className="side-card"><h3>Источники</h3><ReferenceSources links={sources} /></section>}</aside></div></div>
  </ReferenceDetailFrame>;
}

function SuiteTestSummary({ test }: { test: BenchmarkType }) {
  const { lang } = useApp();
  const examples = selectBenchmarkExamples(test, lang);
  const fields = [
    ['Язык', displayDictionaryName(test.language, lang)], ['Модальность', dictionaryNames(test.modalities, lang).join(', ')],
    ['Тип задачи', displayDictionaryName(test.taskType, lang)], ['Сложность', displayDictionaryName(test.difficulty, lang)],
    ['Метрики', test.metrics.join(', ')], ['Размер', test.sizeInSamples ? `${test.sizeInSamples.toLocaleString('ru-RU')} ${pluralRu(test.sizeInSamples, ['пример', 'примера', 'примеров'])}` : ''], ['Доступ', test.confidentialityLevel || ''],
  ].filter(([, value]) => value);
  const description = (lang === 'en' ? test.descriptionEn || test.description : test.description) || '';
  return <><h3>{displayDictionaryName(test, lang)}</h3><div className="desc">{firstReferenceParagraph(test.shortDescription || description)}</div>{fields.length > 0 && <dl className="kv">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}<div className="foot-row"><span className="note">{examples.length ? `${examples.length} ${pluralRu(examples.length, ['пример задачи', 'примера задач', 'примеров задач'])} на странице теста` : 'Паспорт, оценка и источники — на странице теста'}</span><Link className="btn btn-primary" to={ROUTES.BENCHMARK(encodeURIComponent(test.id))}>Открыть страницу теста <ArrowRight className="lucide arr" aria-hidden="true" /></Link></div></>;
}
