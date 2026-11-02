import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useBenchmarkGroupsQuery, useBenchmarkQuery, useMyCatalogSubmissionQuery, useSuiteQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { selectBenchmarkExamples } from '@/features/catalog/selectors';
import { ROUTES } from '@/routes/routes.constants';
import type { BenchmarkSuite, BenchmarkType } from '@/types';
import { dictionaryNames, displayDictionaryName, pluralRu } from '../utils';
import { ReferenceTestCard } from './ReferenceTestCard';
import { ReferenceActions, ReferenceCrumbs, ReferenceDetailFrame, ReferenceDetailState, ReferenceParagraphs, ReferenceSources, downloadReferenceJson, referenceSources } from './ReferenceDetailParts';

export function ReferenceTestDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { status } = useApp();
  const mine = new URLSearchParams(location.search).get('submission') === 'mine';
  const publicTest = useBenchmarkQuery({ id, enabled: !mine });
  const ownTest = useMyCatalogSubmissionQuery({ id, enabled: mine && status === 'authenticated' });
  const test = mine ? ownTest : publicTest;
  const suite = useSuiteQuery({ id: test.data?.suiteId, enabled: !mine });
  const groups = useBenchmarkGroupsQuery({ suiteIds: test.data?.suiteId ? [test.data.suiteId] : undefined }, { enabled: !mine && Boolean(test.data?.suiteId), pageSize: 100, loadAllPages: true });
  const siblings = groups.data?.pages.flatMap(page => page.data).filter(group => group.benchmark.id === test.data?.suiteId).flatMap(group => group.tests).filter(item => item.id !== id) ?? [];
  if (mine && (status === 'anonymous' || status === 'error')) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (mine && status !== 'authenticated') return <ReferenceDetailState kind="test" loading />;
  if (test.isPending) return <ReferenceDetailState kind="test" loading />;
  if (test.isError || !test.data) return <ReferenceDetailState kind="test" onRetry={() => { void test.refetch(); }} />;
  return <TestContent key={test.data.id} test={test.data} suite={mine ? undefined : suite.data} siblings={mine ? [] : siblings} />;
}

function TestContent({ test, suite, siblings }: { test: BenchmarkType; suite?: BenchmarkSuite; siblings: BenchmarkType[] }) {
  const { lang, user } = useApp();
  const name = displayDictionaryName(test, lang);
  const suiteName = displayDictionaryName(suite, lang);
  const multi = Boolean(suite && suite.benchmarkTestsCount > 1) || siblings.length > 0;
  const examples = selectBenchmarkExamples(test, lang);
  const links = referenceSources([test]);
  const description = (lang === 'en' ? test.descriptionEn || test.description : test.description) || (lang === 'en' ? suite?.descriptionEn || suite?.description : suite?.description) || '';
  const evaluation = test.evaluationLogic || (lang === 'en' ? test.instructionsEn || test.instructions : test.instructions);
  const lead = test.shortDescription && test.shortDescription !== description ? test.shortDescription : '';
  const status = test.catalogEntry?.status || test.validationStatus;
  const owner = test.catalogEntry?.authorId || test.authorId;
  const statusLabel = status === 'validation' ? 'На проверке' : status === 'rejected' ? 'Отклонён' : status === 'published' ? 'Одобрен' : '';
  const overline = test.catalogEntry
    ? `${owner === user?.id ? 'Ваш бенчмарк' : 'Бенчмарк от пользователя'}${statusLabel ? ` · ${statusLabel.toLocaleLowerCase('ru')}` : ''}`
    : !multi && suiteName && suiteName !== name ? `Набор ${suiteName}` : multi ? 'Тест набора' : 'Бенчмарк';
  const tags = (values: string[], ink = false) => values.map((value, index) => <span className={`tag${ink ? ' ink' : ''}`} key={`${value}:${index}`}>{value}</span>);
  const language = displayDictionaryName(test.language, lang);
  const passport = [
    ['Язык', language ? tags([language]) : null],
    ['Модальность', test.modalities.length ? tags(dictionaryNames(test.modalities, lang)) : null],
    ['Тип задачи', displayDictionaryName(test.taskType, lang)],
    ['Сложность', test.difficulty ? tags([displayDictionaryName(test.difficulty, lang)]) : null],
    ['Метрики', test.metrics.length ? tags(test.metrics, true) : null],
    ['Домены', dictionaryNames(test.domains, lang).join(', ')],
    ['Поддомены', dictionaryNames(test.subdomains, lang).join(', ')],
    ['Способности', dictionaryNames(test.capabilities, lang).join(', ')],
    ['Размер', test.sizeInSamples ? `${test.sizeInSamples.toLocaleString('ru-RU')} ${pluralRu(test.sizeInSamples, ['пример', 'примера', 'примеров'])}` : ''],
    ['Доступ', test.confidentialityLevel ? <span className={`tag${['К4', 'K4'].includes(test.confidentialityLevel) ? '' : ' lock'}`}>{test.confidentialityLevel}</span> : null],
    ['Уровень знаний', test.knowledgeLevel],
  ] as const;
  const baseline = test.humanBaselineNotes || (test.humanBaseline !== undefined ? String(test.humanBaseline) : '');
  return <ReferenceDetailFrame kind="test">
    <ReferenceCrumbs items={[{ label: 'Каталог', to: ROUTES.CATALOG }, ...(multi && suite ? [{ label: suiteName, to: `${ROUTES.BENCHMARK(encodeURIComponent(suite.id))}?type=suite` }] : []), { label: name }]} />
    <div className="pg-top"><div className="pg-head"><span className="overline">{overline}</span><h1 className="pg-title">{name}</h1>{lead && <p className="pg-lead">{lead}</p>}</div><ReferenceActions onDownload={() => downloadReferenceJson(name, test)} /></div>
    <div className="tp"><div className="tp-main">
      <section className="tp-sec" aria-labelledby="h-about"><h2 id="h-about">О бенчмарке</h2><div className="prose"><ReferenceParagraphs text={description} /></div></section>
      {evaluation && <section className="tp-sec" aria-labelledby="h-eval"><h2 id="h-eval">Как проходит оценка</h2><div className="prose"><ReferenceParagraphs text={evaluation} /></div></section>}
      {status === 'validation' && <div className="callout"><b>На ручной проверке.</b> Суперадмин проверит задания и эталоны, после одобрения бенчмарк появится в каталоге для всех.</div>}
      {status === 'rejected' && <div className="callout bad"><b>Отклонён при проверке.</b> {test.catalogEntry?.rejectionReason || 'Причина не указана.'}</div>}
      {baseline && <div className="callout"><b>Базовый уровень человека.</b> {baseline}</div>}
      {examples.length > 0 ? <section className="tp-sec" aria-labelledby="h-ex"><h2 id="h-ex">Примеры задач <span className="muted" style={{ fontSize: 16 }}>· {examples.length}</span></h2>{examples.map(({ key, example, sourceLabel }, index) => <details className="ex" key={key} open={index === 0}><summary>Пример {index + 1}<ChevronDown aria-hidden="true" /></summary><div className="ex-body">{sourceLabel && <p className="note">{sourceLabel}</p>}{example.input && <div className="ex-blk"><span className="overline">Вход</span><pre>{example.input}</pre></div>}{example.output && <div className="ex-blk out"><span className="overline">Ожидаемый ответ</span><pre>{example.output}</pre></div>}{example.explanation && <div className="ex-blk"><span className="overline">Пояснение</span><p>{example.explanation}</p></div>}</div></details>)}</section> : <section className="tp-sec"><h2>Примеры задач</h2><p className="note">Примеры не приложены.</p></section>}
    </div><aside className="tp-side"><section className="side-card"><h3>Паспорт</h3><dl className="passport">{passport.filter(([, value]) => value !== '' && value != null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>{links.length > 0 && <section className="side-card"><h3>Источники</h3><ReferenceSources links={links} /></section>}{test.gigaMetricLaunchCommand && <section className="side-card"><h3>Запуск оценки</h3><pre>{test.gigaMetricLaunchCommand}</pre></section>}</aside></div>
    {siblings.length > 0 && <section className="cat-sec" aria-labelledby="h-sib"><div className="cat-sec-head"><h2 id="h-sib">Другие тесты набора</h2><Link className="btn btn-secondary btn-sm" to={`${ROUTES.BENCHMARK(encodeURIComponent(test.suiteId))}?type=suite`}>Весь набор · {suite?.benchmarkTestsCount || siblings.length + 1} <ArrowRight className="lucide arr" aria-hidden="true" /></Link></div><div className="grid-cards">{siblings.slice(0, 4).map(item => <ReferenceTestCard key={item.id} test={item} />)}</div></section>}
  </ReferenceDetailFrame>;
}
