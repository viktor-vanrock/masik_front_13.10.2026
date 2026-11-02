import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useBenchmarkGroupsQuery, useFilterOptionsQuery, useSuitesQuery, useMyCatalogSubmissionsQuery } from '@/api/catalog';
import type { BenchmarkGroup, BenchmarkTestListQuery, BenchmarkType, DictionaryRef } from '@/types';
import { useCatalogAnalyticsTracking } from '@/api/analytics';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useSearchParams } from 'react-router-dom';
import { CreateBenchmarkLink } from '@/components/ui/CreateBenchmarkLink';
import type { CatalogFilterKey, CatalogFilterValues, CatalogGroup, CatalogItem } from './types';
import { FilterDrawer } from './ui/FilterDrawer';
import { ReferenceTestCard, languageLabel } from './ui/ReferenceTestCard';
import { ReferenceSuiteDetail } from './ui/ReferenceSuiteDetail';
import { ReferenceTestDetail } from './ui/ReferenceTestDetail';
import { pluralRu } from './utils';

const filterKeys: CatalogFilterKey[] = ['suites', 'language', 'modality', 'taskType', 'difficulty', 'capability', 'domain', 'subdomain', 'macroGroup', 'subGroup', 'abilityTaxon', 'abilityTag'];
function facetValues(test: BenchmarkType, suite: Pick<DictionaryRef, 'name' | 'nameEn'>): Record<CatalogFilterKey, string[]> {
  const names = (entries: DictionaryRef[]) => entries.flatMap(({ name, nameEn }) => [name, nameEn]).filter(Boolean);
  const name = (entry: Pick<DictionaryRef, 'name' | 'nameEn'> | null) => entry ? [entry.name, entry.nameEn].filter(Boolean) : [];
  return { suites: name(suite), language: name(test.language), modality: names(test.modalities), taskType: name(test.taskType), difficulty: name(test.difficulty), capability: names(test.capabilities), domain: names(test.domains), subdomain: names(test.subdomains), macroGroup: name(test.macroGroup), subGroup: names(test.subGroups), abilityTaxon: names(test.abilityTaxons), abilityTag: test.abilityTags };
}
function matchesFilters(test: BenchmarkType, suite: Pick<DictionaryRef, 'name' | 'nameEn'>, selected: CatalogFilterValues, search: string, excluded?: CatalogFilterKey) {
  if (!matchesCatalogSearch(test, suite, search)) return false;
  const values = facetValues(test, suite);
  const families: CatalogFilterKey[][] = [['suites'], ['language'], ['modality'], ['taskType'], ['difficulty'], ['capability'], ['domain', 'subdomain'], ['macroGroup', 'subGroup'], ['abilityTaxon'], ['abilityTag']];
  return families.every(keys => keys.includes(excluded!) || !keys.some(key => selected[key].length) || keys.some(key => selected[key].some(value => values[key].some(name => key === 'language' ? catalogLanguageKey(name) === catalogLanguageKey(value) : name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru')))));
}

function toCatalogItem(test: BenchmarkType, suiteName = ''): CatalogItem {
  return {
    id: test.id,
    name: test.name,
    subtitle: suiteName,
    description: test.shortDescription || test.description,
    domain: test.domains[0]?.name || test.macroGroup?.name || '—',
    origin: test.source || '',
    difficulty: test.difficulty?.name || '—',
    language: test.language?.name?.toLocaleUpperCase('ru') || '—',
    metric: test.metrics.join(', ') || '—',
    samples: test.sizeInSamples,
    status: test.validationStatus === 'published' ? 'Опубликован' : test.validationStatus === 'validation' ? 'На проверке' : test.validationStatus === 'rejected' ? 'Отклонён' : 'Новый',
    tags: [...test.skills, ...test.abilityTags],
    capabilities: test.capabilities.map((capability) => capability.name),
    source: test.source,
    validatedByUmr: test.validatedByUmr,
    authorId: test.catalogEntry?.authorId ?? test.authorId,
    validationStatus: test.validationStatus,
    confidentiality: test.confidentialityLevel,
    benchmark: test,
  };
}

function matchesCatalogSearch(test: BenchmarkType, suite: Pick<DictionaryRef, 'name' | 'nameEn'>, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru');
  if (!normalizedQuery) return true;
  const text = [test.name, test.nameEn, test.description, test.descriptionEn, test.shortDescription, test.taskDescription, suite.name, suite.nameEn, test.taskType?.name, test.language?.name, ...test.metrics, ...test.domains.map(({ name }) => name), ...test.subdomains.map(({ name }) => name), ...test.modalities.map(({ name }) => name), ...test.capabilities.map(({ name }) => name), ...test.abilityTags].join(' ').toLocaleLowerCase('ru');
  return normalizedQuery.split(/\s+/).every(word => text.includes(word));
}


const catalogLanguageKey = (value: string) => {
  const key = value.trim().toLocaleLowerCase('ru').replace('_', '-');
  return ['ru', 'ru-ru', 'rus', 'russian', 'русский'].includes(key) ? 'ru' : key;
};
function catalogLanguageNames(values: string[], languages: DictionaryRef[], lang: string) {
  return [...new Set(values.map((value) => {
    const key = catalogLanguageKey(value);
    const entry = languages.find(({ name, nameEn }) => [name, nameEn].some((name) => catalogLanguageKey(name) === key));
    return entry ? (lang === 'en' ? entry.nameEn : entry.name) : key === 'ru' ? (lang === 'en' ? 'Russian' : 'Русский') : value;
  }))];
}

const emptyCatalogFilterValues = (): CatalogFilterValues => ({ suites: [], language: [], modality: [], taskType: [], difficulty: [], capability: [], domain: [], subdomain: [], macroGroup: [], subGroup: [], abilityTaxon: [], abilityTag: [] });
export function Catalog() {
  const { lang, user } = useApp();
  const mySubmissions = useMyCatalogSubmissionsQuery({ page: 1, limit: 1000 }, { enabled: Boolean(user) });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const updateQuery = (values: { search?: string; language?: string[] }) => {
    const next = new URLSearchParams(searchParams);
    if (values.search !== undefined) { if (values.search) next.set('search', values.search); else next.delete('search'); }
    if (values.language) { next.delete('language'); values.language.forEach((value) => next.append('language', value)); }
    setSearchParams(next, { replace: true });
  };
  const setSearch = (value: string) => updateQuery({ search: value });
  const debouncedSearch = useDebouncedValue(search, 500);

  const [suiteSearch, setSuiteSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilterValues>(emptyCatalogFilterValues);
  const [draftFilterValues, setDraftFilters] = useState<CatalogFilterValues>(emptyCatalogFilterValues);
  const ownTests = useMemo(() => user ? mySubmissions.data?.data ?? [] : [], [user, mySubmissions.data]);
  const ownIds = useMemo(() => new Set(ownTests.map(test => test.id)), [ownTests]);
  const { data: rawFilterOptions } = useFilterOptionsQuery();
  const { data: suiteOptionsResponse } = useSuitesQuery({ page: 1, limit: 1000 });
  const activeFilters = useMemo(() => ({ ...appliedFilters, language: catalogLanguageNames(searchParams.getAll('language'), rawFilterOptions?.languages ?? [], lang) }), [appliedFilters, searchParams, rawFilterOptions, lang]);
  const draftFilters = useMemo(() => ({ ...draftFilterValues, language: catalogLanguageNames(draftFilterValues.language, rawFilterOptions?.languages ?? [], lang) }), [draftFilterValues, rawFilterOptions, lang]);
  const applyFilters = (values: CatalogFilterValues) => { setAppliedFilters({ ...values, language: [] }); updateQuery({ language: values.language }); };

  const catalogQuery = useMemo<BenchmarkTestListQuery>(() => {
    const query: BenchmarkTestListQuery = { search: debouncedSearch.trim() || undefined };
    const displayName = (entry: { name: string; nameEn: string }) => lang === 'en' ? entry.nameEn : entry.name;
    const selectedIds = (entries: Array<{ id: string; name: string; nameEn: string }>, names: string[]) => entries.filter((entry) => names.includes(displayName(entry))).map((entry) => entry.id);
    const suiteIds = (suiteOptionsResponse?.data ?? []).filter((suite) => activeFilters.suites.includes(lang === 'en' ? suite.nameEn : suite.name)).map((suite) => suite.id);
    if (suiteIds.length) query.suiteIds = suiteIds;
    if (rawFilterOptions) {
      const languageIds = selectedIds(rawFilterOptions.languages, activeFilters.language);
      const modalityIds = selectedIds(rawFilterOptions.modalities, activeFilters.modality);
      const difficultyIds = selectedIds(rawFilterOptions.difficulties, activeFilters.difficulty);
      const taskTypeIds = selectedIds(rawFilterOptions.taskTypes, activeFilters.taskType);
      const capabilityIds = selectedIds(rawFilterOptions.capabilities, activeFilters.capability);
      const domainIds = selectedIds(rawFilterOptions.domains, activeFilters.domain);
      const subdomainIds = selectedIds(rawFilterOptions.subdomains, activeFilters.subdomain);
      const macroGroupIds = selectedIds(rawFilterOptions.macroGroups, activeFilters.macroGroup);
      const subGroupIds = selectedIds(rawFilterOptions.subGroups, activeFilters.subGroup);
      const abilityTaxonIds = selectedIds(rawFilterOptions.abilityTaxons, activeFilters.abilityTaxon);
      if (languageIds.length) query.languageIds = languageIds;
      if (modalityIds.length) query.modalityIds = modalityIds;
      if (difficultyIds.length) query.difficultyIds = difficultyIds;
      if (taskTypeIds.length) query.taskTypeIds = taskTypeIds;
      if (capabilityIds.length) query.capabilityIds = capabilityIds;
      if (domainIds.length) query.domainIds = domainIds;
      if (subdomainIds.length) query.subdomainIds = subdomainIds;
      if (macroGroupIds.length) query.macroGroupIds = macroGroupIds;
      if (subGroupIds.length) query.subGroupIds = subGroupIds;
      if (abilityTaxonIds.length) query.abilityTaxonIds = abilityTaxonIds;
      if (activeFilters.abilityTag.length) query.abilityTags = activeFilters.abilityTag;
    }
    return query;
  }, [debouncedSearch, activeFilters, suiteOptionsResponse, rawFilterOptions, lang]);
  useCatalogAnalyticsTracking(catalogQuery);
  const { data: catalogResponse, isPending, isError, refetch } = useBenchmarkGroupsQuery(catalogQuery, { pageSize: 1000, loadAllPages: true });
  const { data: countCatalogResponse, isPending: isCountPending } = useBenchmarkGroupsQuery({}, { pageSize: 1000, enabled: true, loadAllPages: true });
  const groups: CatalogGroup[] = useMemo(() => {
    const responseGroups: BenchmarkGroup[] = catalogResponse?.pages.flatMap((response) => response.data) ?? [];
    return responseGroups.map(({ benchmark: suite, tests }) => ({
      suite,
      tests: tests.map((test) => toCatalogItem(test, suite.name)),
    }));
  }, [catalogResponse]);
  const countGroups: CatalogGroup[] = useMemo(() => {
    const responseGroups: BenchmarkGroup[] = countCatalogResponse?.pages.flatMap((response) => response.data) ?? [];
    return responseGroups.map(({ benchmark: suite, tests }) => ({
      suite,
      tests: tests.map((test) => toCatalogItem(test, suite.name)),
    }));
  }, [countCatalogResponse]);
  const filterOptions = useMemo(() => {
    const displayName = (entry: { name: string; nameEn: string }) => lang === 'en' ? entry.nameEn : entry.name;
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, lang === 'en' ? 'en' : 'ru', { sensitivity: 'base', numeric: true }));
    const fromDictionary = (entries: Array<{ name: string; nameEn: string }>) => unique(entries.map(displayName));
    return {
      suites: unique((suiteOptionsResponse?.data ?? []).map((suite) => lang === 'en' ? suite.nameEn : suite.name)),
      language: fromDictionary(rawFilterOptions?.languages ?? []),
      modality: fromDictionary(rawFilterOptions?.modalities ?? []),
      taskType: fromDictionary(rawFilterOptions?.taskTypes ?? []),
      difficulty: fromDictionary(rawFilterOptions?.difficulties ?? []),
      capability: fromDictionary(rawFilterOptions?.capabilities ?? []),
      domain: fromDictionary(rawFilterOptions?.domains ?? []),
      subdomain: fromDictionary(rawFilterOptions?.subdomains ?? []),
      macroGroup: fromDictionary(rawFilterOptions?.macroGroups ?? []),
      subGroup: fromDictionary(rawFilterOptions?.subGroups ?? []),
      abilityTaxon: fromDictionary(rawFilterOptions?.abilityTaxons ?? []),
      abilityTag: unique(rawFilterOptions?.abilityTags ?? []),
      domainChildren: Object.fromEntries((rawFilterOptions?.domains ?? []).map((parent) => [displayName(parent), unique((rawFilterOptions?.subdomains ?? []).filter((child) => child.domainId === parent.id).map(displayName))])),
      macroChildren: Object.fromEntries((rawFilterOptions?.macroGroups ?? []).map((parent) => [displayName(parent), unique((rawFilterOptions?.subGroups ?? []).filter((child) => child.macroGroupId === parent.id).map(displayName))])),
    };
  }, [lang, rawFilterOptions, suiteOptionsResponse]);
  const filteredGroups = useMemo(() => (countGroups.length ? countGroups : groups).map(group => ({ ...group, tests: group.tests.filter(({ benchmark }) => !ownIds.has(benchmark.id) && matchesFilters(benchmark, group.suite, activeFilters, debouncedSearch)) })).filter(group => group.tests.length), [groups, countGroups, ownIds, activeFilters, debouncedSearch]);
  const countItems = useMemo(() => [...countGroups.flatMap(group => group.tests.filter(({ benchmark }) => !ownIds.has(benchmark.id)).map(({ benchmark }) => ({ test: benchmark, suite: group.suite }))), ...ownTests.map(test => ({ test, suite: test }))], [countGroups, ownIds, ownTests]);
  const draftResultCount = useMemo(() => countItems.filter(({ test, suite }) => matchesFilters(test, suite, draftFilters, debouncedSearch)).length, [countItems, draftFilters, debouncedSearch]);
  const facetCounts = useMemo(() => Object.fromEntries(filterKeys.map(key => [key, Object.fromEntries(filterOptions[key].map(value => [value, countItems.filter(({ test, suite }) => matchesFilters(test, suite, draftFilters, debouncedSearch, key) && facetValues(test, suite)[key].some(name => key === 'language' ? catalogLanguageKey(name) === catalogLanguageKey(value) : name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))).length]))])), [filterOptions, countItems, draftFilters, debouncedSearch]);
  const activeCount = Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
  const reset = () => { setAppliedFilters(emptyCatalogFilterValues()); setDraftFilters(emptyCatalogFilterValues()); updateQuery({ search: '', language: [] }); setSuiteSearch(''); };
  const filtered = Boolean(debouncedSearch.trim() || activeCount);
  const lanes = filteredGroups.filter(({ suite, tests }) => (suite.benchmarkTestsCount || tests.length) > 1);
  const singles = filteredGroups.filter(({ suite, tests }) => (suite.benchmarkTestsCount || tests.length) <= 1);
  const totalTests = (countGroups.length ? countGroups : groups).reduce((sum, { suite, tests }) => sum + (suite.benchmarkTestsCount || tests.length), 0);
  const totalSuites = countGroups.length || groups.length;
  const mine = ownTests.filter(test => matchesFilters(test, test, activeFilters, debouncedSearch));
  const resultCount = filteredGroups.reduce((sum, group) => sum + group.tests.length, 0) + mine.length;
  const chips = filterKeys.flatMap(key => activeFilters[key].map(value => ({ key, value })));
  const changeDraft = (key: CatalogFilterKey, value: string) => {
    const values = new Set(draftFilters[key]);
    if (values.has(value)) values.delete(value); else values.add(value);
    const next = { ...draftFilters, [key]: [...values] };
    setDraftFilters(next); applyFilters(next);
  };

  return <div className="bf-theme bf-app"><div className="view" id="v-catalog">
    <div className="view-bg" aria-hidden="true" />
    <div className="wrap">
      <div className="pg-head"><h1 className="pg-title">Готовые бенчмарки</h1><p className="pg-lead">{totalSuites} {pluralRu(totalSuites, ['набор', 'набора', 'наборов'])} и {totalTests} {pluralRu(totalTests, ['тест', 'теста', 'тестов'])}. Найдите подходящий или возьмите за основу и адаптируйте под свою задачу.</p></div>
      <div className="cat-tools" id="catTools">
        <label className="search"><span className="sr-only">Поиск по каталогу</span><Search aria-hidden="true" /><input className="input" id="catQ" type="search" placeholder="Название, метрика, домен…" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} /><button className="clear" type="button" id="catQx" aria-label="Очистить поиск" hidden={!search} onClick={() => { setSearch(''); document.getElementById('catQ')?.focus(); }}><X aria-hidden="true" /></button></label>
        <button className="btn btn-secondary" type="button" id="filtBtn" aria-haspopup="dialog" onClick={() => { setDraftFilters(activeFilters); setFiltersOpen(true); }}><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5h20" /><path d="M6 12h12" /><path d="M9 19h6" /></svg>Фильтры<span className="count-pill" id="filtN" hidden={!activeCount}>{activeCount || ''}</span></button>
      </div>
      <div className="active-filters" id="actF" aria-label="Применённые фильтры">{chips.map(({ key, value }) => <button className="fchip" key={`${key}:${value}`} type="button" aria-label={`Убрать фильтр ${value}`} onClick={() => applyFilters({ ...activeFilters, [key]: activeFilters[key].filter(item => item !== value) })}>{value}<X aria-hidden="true" /></button>)}{(chips.length > 1 || (chips.length && search)) ? <button className="linkbtn" type="button" onClick={reset}>Сбросить всё</button> : null}</div>
      <div id="catRes">
        {isError ? <div className="empty" role="alert"><h3>Не удалось загрузить каталог</h3><p>Попробуйте ещё раз.</p><div className="row"><button className="btn btn-secondary" type="button" onClick={() => void refetch()}>Повторить</button></div></div> : isPending ? <p className="res-meta" role="status">Загрузка каталога…</p> : <>
          <p className={filtered ? 'res-meta' : 'sr-only'} role="status">{filtered ? `Найдено ${resultCount} ${pluralRu(resultCount, ['тест', 'теста', 'тестов'])}` : ''}</p>
          {!resultCount && <div className="empty"><h3>Ничего не нашлось</h3><p>Попробуйте изменить запрос или фильтры. Или опишите задачу — соберём бенчмарк под неё.</p><div className="row"><button className="btn btn-secondary" type="button" onClick={reset}>Сбросить фильтры</button><CreateBenchmarkLink className="btn btn-primary">Создать бенчмарк <ArrowRight className="arr" aria-hidden="true" /></CreateBenchmarkLink></div></div>}
          {user && <MyBenchmarks tests={mine} isError={mySubmissions.isError} onRetry={() => { void mySubmissions.refetch(); }} />}
          {lanes.length > 0 && <section className="cat-sec" aria-labelledby="h-suites"><div className="cat-sec-head"><h2 id="h-suites">Наборы</h2><p>Несколько тестов, объединённых одной целью</p></div>{lanes.map(({ suite, tests }) => {
            const allCount = suite.benchmarkTestsCount || tests.length;
            const count = filtered && tests.length !== allCount ? `${tests.length} из ${allCount} ${pluralRu(allCount, ['теста', 'тестов', 'тестов'])}` : `${allCount} ${pluralRu(allCount, ['тест', 'теста', 'тестов'])}`;
            const shown = tests.slice(0, 7), rest = allCount - shown.length;
            const url = `/benchmark/${encodeURIComponent(suite.id)}?type=suite`;
            const languages = [...new Set(tests.map(({ benchmark }) => languageLabel(benchmark.language?.name)).filter(Boolean))];
            return <article className="lane" key={suite.id} aria-label={suite.name}><div className="lane-head"><h3>{suite.name}</h3><p>{(suite.description || '').split(/\n+/)[0]}</p><div className="meta"><span className="tag ink">{count}</span>{languages.map(language => <span className="tag" key={language}>{language}</span>)}</div><Link className="btn btn-secondary btn-sm" to={url}>Открыть набор <ArrowRight className="arr" aria-hidden="true" /></Link></div><div className="lane-row">{shown.map(({ benchmark }) => <ReferenceTestCard test={benchmark} key={benchmark.id} />)}{rest > 0 && !filtered && <Link className="tc more" to={url} aria-label={`Ещё ${rest} ${pluralRu(rest, ['тест', 'теста', 'тестов'])} в наборе ${suite.name}`}><b>+{rest}</b><span>{pluralRu(rest, ['тест', 'теста', 'тестов'])} в наборе</span></Link>}</div></article>;
          })}</section>}
          {singles.length > 0 && <section className="cat-sec" aria-labelledby="h-single"><div className="cat-sec-head"><h2 id="h-single">Отдельные бенчмарки</h2><p>{singles.length} {pluralRu(singles.length, ['бенчмарк', 'бенчмарка', 'бенчмарков'])}</p></div><div className="grid-cards">{singles.map(({ tests }) => <ReferenceTestCard test={tests[0].benchmark} key={tests[0].id} />)}</div></section>}
        </>}
      </div>
    </div>
  </div>{filtersOpen && <FilterDrawer onClose={() => setFiltersOpen(false)} onReset={() => { const next = emptyCatalogFilterValues(); setDraftFilters(next); applyFilters(next); }} onApply={() => setFiltersOpen(false)} resultCount={draftResultCount} isCountPending={isCountPending} suiteSearch={suiteSearch} onSuiteSearchChange={setSuiteSearch} filterOptions={filterOptions} selected={draftFilters} facetCounts={countGroups.length ? facetCounts : undefined} onToggle={changeDraft} />}</div>;
}

function MyBenchmarks({ tests, isError, onRetry }: { tests: BenchmarkType[]; isError: boolean; onRetry: () => void }) {
  if (!tests.length && !isError) return null;
  return <section className="cat-sec" aria-labelledby="h-mine"><div className="cat-sec-head"><h2 id="h-mine">Ваши бенчмарки</h2><p>Созданы в чате · статус ручной проверки — в <Link className="inl" to="/profile">личном кабинете</Link></p></div>{isError ? <div className="callout" role="alert">Не удалось загрузить ваши бенчмарки. <button className="linkbtn" type="button" onClick={onRetry}>Повторить</button></div> : <div className="grid-cards">{tests.map(test => <ReferenceTestCard test={test} key={test.id} mine />)}</div>}</section>;
}

export function RedesignedBenchmarkDetail() {
  const { search } = useLocation();
  return new URLSearchParams(search).get('type') === 'suite' ? <ReferenceSuiteDetail /> : <ReferenceTestDetail />;
}
