import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/hooks/useApp';

import { useBenchmarkGroupsQuery, useFilterOptionsQuery, useSuitesQuery, useSuiteQuery } from '@/api/catalog';
import type { BenchmarkGroup, BenchmarkTestListQuery, BenchmarkType } from '@/types';
import { useCatalogAnalyticsTracking } from '@/api/analytics';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Bot, Download, Plus, Search, SlidersHorizontal, X,
} from 'lucide-react';
import type { CatalogFilterValues, CatalogGroup, CatalogItem } from './types';
import { FilterDrawer } from './ui/FilterDrawer';
import { SuiteLane } from './ui/SuiteLane';
import { pluralRu } from './utils';
import { RedesignedTestDetail } from './ui/RedesignedTestDetail';
import { AppliedFilterChips } from './ui/AppliedFilterChips';

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

function matchesCatalogSearch(test: BenchmarkType, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru');
  if (!normalizedQuery) return true;
  return [test.name, test.nameEn, test.description, test.descriptionEn]
    .join(' ')
    .toLocaleLowerCase('ru')
    .includes(normalizedQuery);
}


const emptyCatalogFilterValues = (): CatalogFilterValues => ({ suites: [], language: [], modality: [], taskType: [], difficulty: [], capability: [], domain: [], subdomain: [], macroGroup: [], subGroup: [], abilityTaxon: [], abilityTag: [] });
export function Catalog() {
  const { lang, user } = useApp();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 500);

  const [suiteSearch, setSuiteSearch] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilterValues>(emptyCatalogFilterValues);
  const [draftFilters, setDraftFilters] = useState<CatalogFilterValues>(emptyCatalogFilterValues);
  const [expandedSuiteIds, setExpandedSuiteIds] = useState<Set<string>>(() => new Set());
  const [quickItem, setQuickItem] = useState<CatalogItem | null>(null);
  const { data: rawFilterOptions } = useFilterOptionsQuery();
  const { data: suiteOptionsResponse } = useSuitesQuery({ page: 1, limit: 1000 });
  const activeFilters = appliedFilters;

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
  const { data: catalogResponse, isPending, isError, refetch } = useBenchmarkGroupsQuery(catalogQuery, { pageSize: 1000 });
  const { data: countCatalogResponse, isPending: isCountPending } = useBenchmarkGroupsQuery({}, { pageSize: 1000, enabled: filtersOpen });
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
  const items = useMemo(() => groups.flatMap((group) => group.tests), [groups]);
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
  const filtered = useMemo(() => {
    return items.filter((item) =>
      matchesCatalogSearch(item.benchmark, debouncedSearch) &&
      (!activeFilters.taskType.length || (item.benchmark.taskType && activeFilters.taskType.some((value) => [item.benchmark.taskType?.name, item.benchmark.taskType?.nameEn].some((name) => name?.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.language.length || activeFilters.language.some((value) => [item.benchmark.language?.name, item.benchmark.language?.nameEn].some((name) => name?.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru')))) &&
      (!activeFilters.modality.length || item.benchmark.modalities.some((entry) => activeFilters.modality.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.difficulty.length || (item.benchmark.difficulty && activeFilters.difficulty.some((value) => [item.benchmark.difficulty?.name, item.benchmark.difficulty?.nameEn].some((name) => name?.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.capability.length || item.benchmark.capabilities.some((entry) => activeFilters.capability.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.domain.length || item.benchmark.domains.some((entry) => activeFilters.domain.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.subdomain.length || item.benchmark.subdomains.some((entry) => activeFilters.subdomain.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.macroGroup.length || (item.benchmark.macroGroup && activeFilters.macroGroup.some((value) => [item.benchmark.macroGroup?.name, item.benchmark.macroGroup?.nameEn].some((name) => name?.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.subGroup.length || item.benchmark.subGroups.some((entry) => activeFilters.subGroup.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.abilityTaxon.length || item.benchmark.abilityTaxons.some((entry) => activeFilters.abilityTaxon.some((value) => [entry.name, entry.nameEn].some((name) => name.toLocaleLowerCase('ru') === value.toLocaleLowerCase('ru'))))) &&
      (!activeFilters.abilityTag.length || item.benchmark.abilityTags.some((entry) => activeFilters.abilityTag.some((value) => value.toLocaleLowerCase('ru') === entry.toLocaleLowerCase('ru')))),
    );
  }, [debouncedSearch, items, activeFilters]);
  const filteredGroups = useMemo(() => {
    const visibleTestIds = new Set(filtered.map((item) => item.id));
    return groups.map((group) => ({
      ...group,
      tests: group.tests.filter((test) => visibleTestIds.has(test.id)),
    })).filter((group) => group.tests.length > 0 && (!activeFilters.suites.length || activeFilters.suites.includes(lang === 'en' ? group.suite.nameEn : group.suite.name)));
  }, [filtered, groups, activeFilters.suites, lang]);
  const draftResultCount = useMemo(() => countGroups.reduce((total, group) => {
    const suiteName = lang === 'en' ? group.suite.nameEn : group.suite.name;
    if (draftFilters.suites.length && !draftFilters.suites.includes(suiteName)) return total;
    return total + group.tests.filter((test) => {
      const matches = (selected: string[], names: Array<string | undefined>) => !selected.length || names.some((name) => name && selected.some((value) => value.toLocaleLowerCase('ru') === name.toLocaleLowerCase('ru')));
      const benchmark = test.benchmark;
      return matchesCatalogSearch(benchmark, debouncedSearch) &&
        matches(draftFilters.language, [benchmark.language?.name, benchmark.language?.nameEn]) &&
        matches(draftFilters.modality, benchmark.modalities.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.taskType, [benchmark.taskType?.name, benchmark.taskType?.nameEn]) &&
        matches(draftFilters.difficulty, [benchmark.difficulty?.name, benchmark.difficulty?.nameEn]) &&
        matches(draftFilters.capability, benchmark.capabilities.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.domain, benchmark.domains.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.subdomain, benchmark.subdomains.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.macroGroup, [benchmark.macroGroup?.name, benchmark.macroGroup?.nameEn]) &&
        matches(draftFilters.subGroup, benchmark.subGroups.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.abilityTaxon, benchmark.abilityTaxons.flatMap((entry) => [entry.name, entry.nameEn])) &&
        matches(draftFilters.abilityTag, benchmark.abilityTags);
    }).length;
  }, 0), [countGroups, draftFilters, debouncedSearch, lang]);
  const activeCount = Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
  const reset = () => { setAppliedFilters(emptyCatalogFilterValues()); setDraftFilters(emptyCatalogFilterValues()); setSearch(''); setSuiteSearch(''); };
  const openBenchmark = (item: CatalogItem) => navigate(`/benchmark/${encodeURIComponent(item.id)}`);

  return (
    <main className="min-h-screen bg-white text-[#1e1e20]">
      <div className="mx-auto min-h-[calc(100vh-175px)] max-w-[1280px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[clamp(2rem,3.4vw,3rem)] font-medium leading-tight tracking-[-1.5px]">Каталог</h1>
            <p className="mt-2.5 max-w-[690px] text-[14px] font-normal leading-relaxed text-[#686e78]">Поиск по тестам с сохранением контекста набора.</p>
          </div>
          <button type="button" onClick={() => navigate('/create')} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[30px] border border-transparent bg-[#515dad] px-5 text-[13px] font-medium text-white transition hover:bg-[#465195] sm:self-auto">Создать бенчмарк <Plus size={20} /></button>
        </div>

        <section className="min-w-0">
          <div className="mb-[10px] grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[10px] max-[760px]:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block min-w-0 max-[760px]:col-span-2"><Search size={18} className="pointer-events-none absolute left-[14px] top-[14px] text-[#686e78]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Название или описание теста" className="h-[46px] w-full rounded-[10px] border border-[#d1d7de] bg-white pl-[42px] pr-10 text-[13px] outline-none transition placeholder:text-[#686e78] hover:border-[#465195] focus:border-[#515dad] focus:ring-2 focus:ring-[#515dad]/10" />{search && <button type="button" aria-label="Очистить поиск" onClick={() => setSearch('')} className="absolute right-[9px] top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[#686e78] transition hover:bg-[#f3f6fa] hover:text-[#1e1e20]"><X size={14} /></button>}</label>
            <button type="button" aria-expanded={filtersOpen} aria-controls="catalog-filter-drawer" onClick={() => { setDraftFilters(appliedFilters); setFiltersOpen(true); }} className={`inline-flex h-10 w-[114px] cursor-pointer items-center justify-center gap-2 rounded-[30px] border px-3 text-[12px] font-[450] leading-5 transition ${filtersOpen ? 'border-[#afb4d9] bg-[#eeeff7] text-[#3a427b]' : 'border-transparent bg-[#515dad1a] text-[#515dad] hover:bg-[#515dad26]'}`}><SlidersHorizontal size={18} />Фильтры{activeCount > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#515dad] px-1 text-[10px] text-white">{activeCount}</span>}</button>
            <span className="whitespace-nowrap text-[12px] text-[#686e78] max-[760px]:col-span-2">{filtered.length} {pluralRu(filtered.length, ['тест', 'теста', 'тестов'])} в {filteredGroups.length} {pluralRu(filteredGroups.length, ['наборе', 'наборах', 'наборах'])}</span>
          </div>
          <AppliedFilterChips filters={appliedFilters} onRemove={(key, value) => {
            setAppliedFilters((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) }));
          }} onClear={() => setAppliedFilters(emptyCatalogFilterValues())} />
          {isError ? <div className="rounded-2xl border border-dashed border-[#d1d7de] bg-white px-6 py-16 text-center"><h3 className="font-medium">Не удалось загрузить каталог</h3><button type="button" onClick={() => refetch()} className="mt-4 rounded-lg bg-[#515dad] px-4 py-2 text-sm font-medium text-white">Повторить</button></div> : isPending ? <div className="space-y-6">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-[280px] animate-pulse rounded-2xl border border-[#e9edf2] bg-[#f8f9fb]" />)}</div> : filteredGroups.length ? <div className="space-y-[30px]">{filteredGroups.map((group) => <SuiteLane key={group.suite.id} group={group} contextTests={countGroups.find((candidate) => candidate.suite.id === group.suite.id)?.tests ?? group.tests} expanded={expandedSuiteIds.has(group.suite.id)} onToggle={() => setExpandedSuiteIds((previous) => { const next = new Set(previous); if (next.has(group.suite.id)) next.delete(group.suite.id); else next.add(group.suite.id); return next; })} onSuiteDetails={() => navigate(`/benchmark/${encodeURIComponent(group.suite.id)}?type=suite`)} onDetails={openBenchmark} onQuick={setQuickItem} lang={lang} userId={user?.id} isFiltering={Boolean(search.trim() || activeCount)} />)}</div> : <div className="rounded-[16px] bg-[#f3f6fa] px-6 py-16 text-center"><h3 className="mb-2 text-[20px] font-medium leading-[1.4] tracking-[-.4px]">Ничего не найдено</h3><p className="text-[14px] leading-[1.5] text-[#686e78]">Измените запрос или сбросьте фильтры. Поиск ищет название и описание теста.</p><button type="button" onClick={reset} className="mt-5 inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[30px] border border-transparent bg-[#515dad1a] px-5 py-3 text-[13px] font-[450] leading-5 text-[#515dad] shadow-none transition hover:bg-[#515dad26]">Сбросить фильтры</button></div>}
        </section>
      </div>
      {quickItem && (() => {
        const quickItems = filteredGroups.flatMap((group) => group.tests);
        if (!quickItems.some((item) => item.id === quickItem.id)) quickItems.unshift(quickItem);
        const position = quickItems.findIndex((item) => item.id === quickItem.id);
        return <QuickPreview item={quickItem} position={position} items={quickItems} onClose={() => setQuickItem(null)} onSelect={setQuickItem} onOpen={() => { setQuickItem(null); openBenchmark(quickItem); }} />;
      })()}
      {filtersOpen && <FilterDrawer onClose={() => setFiltersOpen(false)} onReset={() => setDraftFilters(emptyCatalogFilterValues())} onApply={() => { setAppliedFilters(draftFilters); setFiltersOpen(false); }} resultCount={draftResultCount} isCountPending={isCountPending} suiteSearch={suiteSearch} onSuiteSearchChange={setSuiteSearch} filterOptions={filterOptions} selected={draftFilters} onToggle={(key, value) => setDraftFilters((current) => { const values = new Set(current[key] ?? []); if (values.has(value)) values.delete(value); else values.add(value); return { ...current, [key]: [...values] }; })} />}
    </main>
  );
}

function QuickPreview({ item, position, items, onClose, onSelect, onOpen }: { item: CatalogItem; position: number; items: CatalogItem[]; onClose: () => void; onSelect: (item: CatalogItem) => void; onOpen: () => void }) {
  const total = items.length;
  const test = item.benchmark;
  const tags = [...test.domains.map((entry) => entry.name), ...test.abilityTaxons.map((entry) => entry.name), item.difficulty].filter(Boolean).slice(0, 3);
  const stats = [['Размер выборки', item.samples.toLocaleString('ru-RU')], ['Метрика', item.metric], ['Тип задачи', test.taskType?.name || '—'], ['Сложность', item.difficulty]];
  const example = test.examples[0];
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, []);
  useEffect(() => {
    if (total < 2) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const nextIndex = position + (event.key === 'ArrowRight' ? 1 : -1);
      const next = items[nextIndex];
      if (!next) return;
      event.preventDefault();
      onSelect(next);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, onSelect, position, total]);

  const move = (direction: -1 | 1) => {
    const next = items[position + direction];
    if (next) onSelect(next);
  };
  const carouselButton = (direction: -1 | 1) => {
    const target = items[position + direction];
    const previous = direction === -1;
    return <button type="button" disabled={!target} onMouseDown={(event) => event.stopPropagation()} onClick={() => move(direction)} aria-label={target ? `${previous ? 'Предыдущий' : 'Следующий'} тест: ${target.name}` : `${previous ? 'Предыдущего' : 'Следующего'} теста нет`} title={previous ? 'Предыдущий тест' : 'Следующий тест'} className={`fixed top-1/2 z-[70] grid h-16 w-11 -translate-y-1/2 place-items-center rounded-lg bg-transparent text-white opacity-[.84] drop-shadow-[0_2px_5px_#11182780] transition hover:scale-[1.08] hover:bg-white/[.08] hover:opacity-100 disabled:cursor-default disabled:opacity-20 max-[800px]:w-8 max-[520px]:h-[54px] max-[520px]:w-8 ${previous ? 'left-[max(8px,calc(50vw-546px))] max-[800px]:left-1 max-[520px]:left-0.5' : 'right-[max(8px,calc(50vw-546px))] max-[800px]:right-1 max-[520px]:right-0.5'}`}><svg aria-hidden="true" viewBox="0 0 24 24" className={`h-[50px] w-[50px] stroke-current stroke-[2] max-[520px]:h-[42px] max-[520px]:w-[42px] ${previous ? 'rotate-180' : ''}`} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></button>;
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17213a]/25 p-5 backdrop-blur-[4px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>{total > 1 && <>{carouselButton(-1)}{carouselButton(1)}</>}<section role="dialog" aria-modal="true" aria-labelledby="quick-preview-title" className="max-h-[calc(100vh-40px)] w-[calc(100vw-96px)] max-w-[960px] overflow-auto rounded-[25px] bg-white shadow-[0_30px_100px_rgba(30,30,32,.15)]" onMouseDown={(event) => event.stopPropagation()}><header className="flex items-start justify-between gap-5 px-5 pb-3 pt-[22px] min-[801px]:px-7 min-[801px]:pt-[26px]"><div className="min-w-0"><h2 id="quick-preview-title" className="text-[24px] font-medium tracking-[-.6px]">{item.name}</h2>{test.nameEn && test.nameEn !== item.name && <p className="mt-1 text-[12px] text-[#686e78]">{test.nameEn}</p>}</div></header><div className="overflow-auto px-5 pb-[22px] min-[801px]:px-7 min-[801px]:pb-7"><div className="mb-2.5 text-[10px] text-[#686e78]"><span>В составе </span><span className="inline-flex items-center gap-1 text-[#3a427b] font-medium hover:underline">{item.subtitle}<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[11px] w-[11px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></span></div><div className="mb-2.5 flex flex-wrap gap-[7px]">{tags.map((tag, index) => <span key={`${tag}-${index}`} className={`rounded-md px-2 py-1 text-[10px] ${index === 0 ? 'bg-[#eeeff7] text-[#3a427b]' : 'bg-[#f3f6fa] text-[#686e78]'}`}>{tag}</span>)}</div><p className="mb-[14px] line-clamp-3 text-[12px] leading-[1.65] text-[#1e1e20]">{test.shortDescription || item.description || 'Описание теста не указано.'}</p><div className="grid gap-[18px] min-[801px]:grid-cols-[minmax(260px,.78fr)_minmax(380px,1.22fr)]"><div><span className="mb-2 block text-[9px] font-[550] uppercase tracking-[.06em] text-[#686e78]">Ключевые параметры</span><div className="grid overflow-hidden rounded-[12px] border border-[#e9edf2] min-[521px]:grid-cols-2">{stats.map(([label, value], index) => <div key={label} className={`min-h-[68px] px-[14px] py-[13px] ${index > 0 ? 'border-t border-[#e9edf2]' : ''} ${index % 2 === 1 ? `min-[521px]:border-l min-[521px]:border-[#e9edf2] ${index === 1 ? 'min-[521px]:border-t-0' : ''}` : ''} ${index > 1 ? 'min-[521px]:border-t min-[521px]:border-[#e9edf2]' : ''}`}><span className="mb-1 block text-[10px] leading-none text-[#686e78]">{label}</span><strong className="block text-[12px] font-medium">{value}</strong></div>)}</div></div><aside className="overflow-hidden rounded-[14px] border border-[#e9edf2] bg-[#f8fafc]"><div className="border-b border-[#e9edf2] bg-white px-4 py-[6px]"><strong className="text-[12px] font-[550]">Пример задачи</strong></div>{example ? <div className="max-h-[250px] overflow-auto px-4 pb-4 pt-8"><QuickExampleField label="Задание" value={example.input} />{example.output && <QuickExampleField label="Ответ" value={example.output} />}{example.explanation && <QuickExampleField label="Пояснение" value={example.explanation} />}</div> : <div className="p-5 text-center text-[11px] text-[#686e78]">Примера пока нет</div>}</aside></div><footer className="mt-[14px] flex flex-wrap items-start justify-end gap-[10px] border-t border-[#e9edf2] pt-5 max-[700px]:flex-col max-[700px]:items-stretch max-[700px]:[&>button]:w-full">{total > 1 && <span className="quick-preview-carousel-count mr-auto self-start pt-0 text-[11px] leading-5 text-[#686e78] max-[700px]:order-1 max-[700px]:mr-0 max-[700px]:self-auto max-[700px]:text-center">{position + 1} из {total}</span>}<button type="button" onClick={onClose} className="inline-flex cursor-pointer items-center rounded-[30px] border border-transparent bg-[#515dad1a] px-5 py-3 text-[13px] font-[450] leading-5 text-[#515dad] shadow-none transition hover:bg-[#515dad26] max-[700px]:order-3 max-[700px]:justify-center">Закрыть</button><button type="button" onClick={onOpen} className="inline-flex cursor-pointer items-center gap-[10px] rounded-[30px] border border-transparent bg-[#515dad] px-5 py-3 text-[13px] font-[450] leading-5 text-white transition hover:bg-[#465195] max-[700px]:order-2 max-[700px]:justify-center">Открыть страницу<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button></footer></div></section></div>;
}

function QuickExampleMessage({ label, value, clamped = false }: { label: string; value: string; clamped?: boolean }) {
  const RoleIcon = label === 'Ответ' ? Bot : null;
  const textClass = `whitespace-pre-wrap break-words text-[12px] leading-[1.65] ${label === 'Задание' ? 'text-[#686e78]' : 'text-[#1e1e20]'}`;
  return <div className="flex items-start gap-2">{RoleIcon && <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] bg-[#eeeff7] text-[#3a427b]"><RoleIcon size={10} strokeWidth={1.8} /></span>}<p className={`${textClass} ${clamped ? 'line-clamp-3' : ''}`}>{value}</p></div>;
}

function QuickExampleField({ label, value }: { label: string; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const longValue = value.length > 260 || value.split('\n').length > 7;

  const isTask = label === 'Задание';


  if (!longValue) return <div className="rounded-[10px] border border-[#e9edf2] bg-white p-[14px] [&+div]:mt-3">{!isTask && <span className="mb-2 block text-[10px] font-[550] uppercase tracking-[.04em] text-[#3a427b]">{label}</span>}<QuickExampleMessage label={label} value={value} /></div>;
  return <div className="rounded-[10px] border border-[#e9edf2] bg-white p-[14px] [&+div]:mt-3"><div className="flex items-center justify-between gap-2 border-b border-[#e9edf2] pb-3">{!isTask && <span className="text-[10px] font-[550] uppercase tracking-[.04em] text-[#3a427b]">{label}</span>}<button type="button" onClick={() => setExpanded((current) => !current)} className={`inline-flex cursor-pointer items-center gap-1 text-[10px] font-medium text-[#3a427b] ${isTask ? 'ml-auto' : ''}`}><span>{expanded ? 'Свернуть' : 'Развернуть'}</span><svg aria-hidden="true" viewBox="0 0 18 18" className={`h-[14px] w-[14px] fill-none stroke-current stroke-[1.8] transition-transform [stroke-linecap:round] [stroke-linejoin:round] ${expanded ? 'rotate-90' : ''}`}><path d="m7 4 5 5-5 5" /></svg></button></div><div className="mt-3"><QuickExampleMessage label={label} value={value} clamped={!expanded} /></div></div>;
}

export function RedesignedBenchmarkDetail() {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  return new URLSearchParams(search).get('type') === 'suite'
    ? <RedesignedSuiteDetail id={id} />
    : <RedesignedTestDetail />;
}

function RedesignedSuiteDetail({ id }: { id?: string }) {
  const navigate = useNavigate();
  const { data: suite, isPending, isError, refetch } = useSuiteQuery({ id });
  const { data: groups } = useBenchmarkGroupsQuery({ suiteIds: id ? [id] : undefined }, { pageSize: 100 });
  const tests = groups?.pages.flatMap((page) => page.data).flatMap((group) => group.tests) ?? [];
  const [activeTab, setActiveTab] = useState<'composition' | 'about' | 'sources'>('composition');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [testSearch, setTestSearch] = useState('');

  const activeTest = tests.find((test) => test.id === activeTestId) ?? tests[0];
  const searchableTests = tests.filter((test) => [test.name, test.nameEn, test.shortDescription, test.description].join(' ').toLocaleLowerCase('ru').includes(testSearch.toLocaleLowerCase('ru')));
  const testGroups = useMemo(() => {
    const byDomain = new Map<string, BenchmarkType[]>();
    for (const test of searchableTests) {
      const domainName = test.domains[0]?.name || 'Другие тесты';
      byDomain.set(domainName, [...(byDomain.get(domainName) ?? []), test]);
    }
    return tests.length > 8 && byDomain.size > 1 ? [...byDomain.entries()] : [['Все тесты', searchableTests] as [string, BenchmarkType[]]];
  }, [searchableTests, tests.length]);
  const facts = [
    `${tests.length} ${pluralRu(tests.length, ['тест', 'теста', 'тестов'])}`,
    ...new Set(tests.map((test) => test.language?.name).filter(Boolean)),
    ...(new Set(tests.map((test) => test.difficulty?.name).filter(Boolean)).size === 1 ? [tests[0]?.difficulty?.name] : []),
  ].filter(Boolean) as string[];
  const suiteLanguages = [...new Set(tests.flatMap((test) => {
    const language = test.language?.name?.trim();
    if (!language) return [];
    const normalized = language.toLocaleLowerCase('ru');
    return [['ru', 'rus', 'russian', 'русский'].includes(normalized) ? 'Русский' : ['en', 'eng', 'english', 'английский'].includes(normalized) ? 'English' : language];
  }))];
  const canAdaptToRussian = suiteLanguages.length > 0 && suiteLanguages.every((language) => language !== 'Русский');
  const references = [...new Map(tests.flatMap((test) => test.references).map((item) => [item.url, item])).values()];
  const links = [...new Map(tests.flatMap((test) => test.links).map((item) => [item.url, item])).values()];
  const commonValue = (values: Array<string | undefined>) => {
    const unique = [...new Set(values.filter((value): value is string => Boolean(value)))];
    return unique.length === 1 ? unique[0] : 'Разные';
  };
  const aboutFacts = [
    ['Тестов', String(tests.length)],
    ['Язык', commonValue(tests.map((test) => test.language?.name))],
    ['Модальность', commonValue(tests.map((test) => test.modalities.map((item) => item.name).join(', ')))],
    ['Доступ', commonValue(tests.map((test) => test.confidentialityLevel))],
    ['Метрика', commonValue(tests.map((test) => test.metrics.join(', ')))],
  ];
  if (isPending) return <main className="min-h-[calc(100vh-175px)] bg-white"><div className="mx-auto max-w-[1280px] px-5 py-12"><div className="h-10 w-2/3 animate-pulse rounded-lg bg-[#f3f6fa]" /><div className="mt-5 h-24 animate-pulse rounded-2xl bg-[#f3f6fa]" /></div></main>;
  if (isError || !suite) return <main className="min-h-[calc(100vh-175px)] bg-white px-5 py-16 text-center text-[#1e1e20]"><p className="text-sm text-[#686e78]">Не удалось загрузить набор.</p><button type="button" onClick={() => void refetch()} className="mt-4 rounded-lg bg-[#515dad] px-4 py-2 text-sm text-white">Повторить</button></main>;

  const downloadSuite = () => {
    const exportData = {
      ...suite,
      tests,
      exportNote: 'Метаданные и доступные примеры. Полный внешний датасет не включён.',
    };
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${suite.name || 'benchmark'}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };


  return <main className="min-h-[calc(100vh-175px)] bg-white text-[#1e1e20]"><div className="mx-auto max-w-[1280px] px-5 pb-12 pt-[34px] sm:px-8 lg:px-10 lg:pb-20"><nav aria-label="Навигационная цепочка" className="mb-[18px] flex items-center gap-2.5 text-[12px] text-[#686e78]"><button type="button" onClick={() => navigate('/')} className="cursor-pointer text-[#3a427b]">Каталог</button><svg aria-hidden="true" viewBox="0 0 18 18" className="h-[14px] w-[14px] shrink-0 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="m7 4 5 5-5 5" /></svg><span className="truncate">{suite.name}</span></nav><header className="mb-[22px] grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8"><div className="max-w-[780px]"><h1 className="mb-2 text-[40px] font-medium leading-[1.15] tracking-[-1.6px] max-sm:text-[32px]">{suite.name}</h1>{suite.nameEn !== suite.name && <p className="mb-2.5 text-[12px] text-[#686e78]">{suite.nameEn}</p>}<p className="line-clamp-3 text-[13px] leading-[1.75] text-[#686e78]">{suite.description || 'Описание набора не указано.'}</p>{(suite.description?.length ?? 0) > 280 && <button type="button" onClick={() => setActiveTab('about')} className="mt-1 cursor-pointer text-[11px] text-[#515dad]">Показать полное описание</button>}<div className="mt-4 flex flex-wrap gap-[7px]">{facts.map((fact, index) => <span key={fact} className={`rounded-md px-2 py-1 text-[10px] ${index === 0 ? 'bg-[#eeeff7] text-[#3a427b]' : 'bg-[#f3f6fa] text-[#686e78]'}`}>{fact}</span>)}</div></div><div className="flex max-w-[480px] flex-col items-start gap-2 lg:items-end"><div className="flex flex-wrap gap-2">{/* <button type="button" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad] px-[13px] text-[13px] font-[450] leading-5 text-white transition hover:bg-[#465195]"><Play size={16} />Оценить на наборе</button> */}<button type="button" onClick={downloadSuite} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad1a] px-[13px] text-[13px] font-[450] leading-5 text-[#515dad] transition hover:bg-[#515dad26]"><Download size={18} />Скачать</button><button type="button" onClick={() => navigate(`/create?mode=modify&base=${encodeURIComponent(suite.id)}&baseType=suite&new=${Date.now()}`)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[30px] border border-transparent bg-[#515dad1a] px-[13px] text-[13px] font-[450] leading-5 text-[#515dad] transition hover:bg-[#515dad26]">Улучшить<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"><path d="m9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg></button></div>{canAdaptToRussian && <button type="button" onClick={() => navigate(`/create?mode=russify&base=${encodeURIComponent(suite.id)}&baseType=suite&new=${Date.now()}`)} className="inline-flex h-10 cursor-pointer items-center justify-center gap-[10px] rounded-[30px] border border-transparent bg-[#9097a126] px-[13px] py-[9px] text-[13px] font-[450] leading-5 text-[#1e1e20] transition hover:bg-[#9097a140]">Адаптировать на русский<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.65] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M9 16A7 7 0 1 0 9 2a7 7 0 0 0 0 14M2 9h14M9 2c-4 4-4 10 0 14M9 2c4 4 4 10 0 14" /></svg></button>}</div></header><div role="tablist" className="mb-[18px] flex gap-7 overflow-x-auto border-b border-[#e9edf2]">{([['composition', 'Состав', tests.length], ['about', 'О наборе', ''], ['sources', 'Источники', '']] as const).map(([key, label, count]) => <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)} className={`min-h-10 whitespace-nowrap border-b-2 px-0 py-3 text-[12px] ${activeTab === key ? 'border-[#515dad] text-[#515dad]' : 'border-transparent text-[#686e78]'}`}>{label}{count !== '' && <span className="ml-1 text-[#686e78]">{count}</span>}</button>)}</div>{activeTab === 'composition' && (activeTest ? <div className={`grid items-start gap-4 ${tests.length > 1 ? 'min-[761px]:grid-cols-[250px_minmax(0,1fr)] min-[981px]:grid-cols-[300px_minmax(0,1fr)]' : 'max-w-[920px]'}`}>{tests.length > 1 && <aside className="max-h-[calc(100vh-125px)] overflow-hidden rounded-2xl border border-[#e9edf2] bg-white lg:sticky lg:top-[104px]"><div className="border-b border-[#e9edf2] p-3.5"><strong className="block text-[13px]">Тесты набора</strong>{tests.length > 8 && <label className="relative mt-2 block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686e78]" /><input value={testSearch} onChange={(event) => setTestSearch(event.target.value)} placeholder="Найти тест" className="h-[38px] w-full rounded-lg border border-[#d1d7de] pl-9 pr-2 text-[11px] outline-none" /></label>}</div><div className="max-h-[calc(100vh-230px)] overflow-y-auto p-[7px]">{testGroups.map(([label, groupedTests]) => <section key={label} className="border-b border-[#e9edf2] pb-2 pt-2 last:border-0"><div className="flex justify-between px-2 py-[5px] text-[9px] font-medium uppercase tracking-[.05em] text-[#686e78]"><span>{label}</span><span>{groupedTests.length}</span></div>{groupedTests.map((test) => <button key={test.id} type="button" onClick={() => setActiveTestId(test.id)} className={`block w-full rounded-lg px-[10px] py-[9px] text-left ${test.id === activeTest.id ? 'bg-[#eeeff7] text-[#3a427b]' : 'hover:bg-[#f7f8fb]'}`}><strong className="block text-[11px] font-medium leading-[1.4]">{test.name}</strong><small className="mt-1 block text-[9px] text-[#686e78]">{test.taskType?.name || test.metrics.join(', ')}</small></button>)}</section>)}</div></aside>}<SuiteTestPreview test={activeTest} onOpen={() => navigate(`/benchmark/${encodeURIComponent(activeTest.id)}`)} /></div> : <p className="text-sm text-[#686e78]">В наборе нет доступных тестов.</p>)}{activeTab === 'about' && <section className="max-w-[920px] rounded-2xl border border-[#e9edf2] bg-white p-[26px]"><section><h2 className="mb-3 text-[19px] font-medium">О наборе</h2><p className="text-[13px] leading-[1.85] text-[#686e78]">{suite.description || 'Описание набора не приложено.'}</p>{suite.descriptionEn && suite.descriptionEn !== suite.description && <p className="mt-[14px] text-[13px] leading-[1.85] text-[#686e78]">{suite.descriptionEn}</p>}</section><section className="mt-[26px] border-t border-[#e9edf2] pt-6"><h2 className="mb-3 text-[19px] font-medium">Общие характеристики</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{aboutFacts.map(([label, value]) => <div key={label} className="rounded-[10px] border border-[#e9edf2] bg-[#fafbfc] p-[13px]"><span className="mb-[5px] block text-[9px] text-[#686e78]">{label}</span><strong className="block text-[12px]">{value}</strong></div>)}</div></section></section>}{activeTab === 'sources' && <section className="max-w-[920px] rounded-2xl border border-[#e9edf2] bg-white p-[26px]"><section><h2 className="mb-3 text-[19px] font-medium">Источники и материалы</h2><div className="grid gap-7 min-[761px]:grid-cols-2"><div className="pb-4"><h3 className="mb-2 text-[15px] font-medium">Публикации</h3>{references.length ? <ul className="m-0 list-none border-b border-[#e9edf2] p-0">{references.map((reference) => <li key={reference.url} className="border-b border-[#e9edf2] py-4 last:border-b-0"><a href={reference.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[15px] leading-[1.85] text-[#3a427b]">{reference.title || reference.url}<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M10 2h6v6m0-6-9 9M7 3H2v13h13v-5" /></svg></a></li>)}</ul> : <p className="text-[13px] leading-[1.85] text-[#686e78]">Нет записей.</p>}</div><div className="pb-4"><h3 className="mb-2 text-[15px] font-medium">Ссылки и репозитории</h3>{links.length ? <ul className="m-0 list-none border-b border-[#e9edf2] p-0">{links.map((link) => <li key={link.url} className="border-b border-[#e9edf2] py-4 last:border-b-0"><a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[15px] leading-[1.85] text-[#3a427b]">{link.title || link.url}{link.type && <span className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{link.type}</span>}<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M10 2h6v6m0-6-9 9M7 3H2v13h13v-5" /></svg></a></li>)}</ul> : <p className="text-[13px] leading-[1.85] text-[#686e78]">Нет записей.</p>}</div></div></section></section>}</div></main>;
}

function SuiteTestPreview({ test, onOpen }: { test: BenchmarkType; onOpen: () => void }) {
  const description = test.shortDescription || test.description;
  const tags = [...test.domains.map((item) => item.name), ...test.abilityTaxons.map((item) => item.name), test.taskType?.name, test.difficulty?.name].filter(Boolean).slice(0, 6);
  const example = test.examples[0];
  return <article className="overflow-hidden rounded-2xl border border-[#e9edf2] bg-white"><header className="flex flex-col justify-between gap-4 border-b border-[#e9edf2] px-6 py-[22px] min-[761px]:flex-row"><div><h2 className="text-[24px] font-medium tracking-[-.6px]">{test.name}</h2>{test.nameEn !== test.name && <p className="mt-1 text-[11px] text-[#686e78]">{test.nameEn}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{tags.map((tag) => <span key={tag} className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{tag}</span>)}</div></div><button type="button" onClick={onOpen} className="inline-flex min-h-[38px] shrink-0 cursor-pointer items-center gap-2 self-start whitespace-nowrap rounded-[30px] border border-transparent bg-[#515dad1a] px-3 py-2 text-[12px] font-[450] leading-5 text-[#515dad] transition hover:bg-[#515dad26]">Полная страница<svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4 shrink-0 fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button></header><div className="px-6 py-[22px]"><p className="text-[12px] leading-[1.8] text-[#686e78]">{description}</p><div className="mt-[18px] grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[['Размер', test.sizeInSamples || '—'], ['Метрика', test.metrics.join(', ') || '—'], ['Тип задачи', test.taskType?.name || '—'], ['Язык', test.language?.name || '—']].map(([label, value]) => <div key={label} className="rounded-[9px] border border-[#e9edf2] bg-[#fafbfc] p-3"><span className="block text-[9px] text-[#686e78]">{label}</span><strong className="mt-1 block text-[11px]">{value}</strong></div>)}</div><section className="mt-[22px] border-t border-[#e9edf2] pt-5"><h3 className="mb-[11px] text-[15px] font-medium">Что проверяет</h3><div className="mt-3 flex flex-wrap gap-1.5">{[...test.abilityTaxons.map((item) => item.name), ...test.subGroups.map((item) => item.name)].slice(0, 6).map((tag) => <span key={tag} className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{tag}</span>)}</div></section><section className="mt-[22px] border-t border-[#e9edf2] pt-5"><h3 className="mb-[11px] text-[15px] font-medium">Пример задачи</h3>{example ? <div className="max-h-[430px] overflow-auto rounded-[11px] border border-[#e9edf2] bg-[#f8fafc] px-4 pb-4 pt-6"><ExamplePreviewField value={example.input} />{example.output && <ExamplePreviewField value={example.output} separated />}{example.explanation && <ExamplePreviewField value={example.explanation} separated />}</div> : <div className="rounded-[10px] bg-[#f7f8fb] p-6 text-center text-[11px] text-[#686e78]">Для этого теста пример пока не приложен.</div>}</section></div><footer className="flex justify-end border-t border-[#e9edf2] px-6 py-4"><button type="button" onClick={onOpen} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[30px] bg-[#515dad] px-5 py-3 text-[12px] text-white transition hover:bg-[#465195]">Открыть страницу теста<svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button></footer></article>;
}

function ExamplePreviewField({ value, separated = false }: { value: string; separated?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const longValue = value.length > 260 || value.split('\n').length > 7;
  const spacing = separated ? 'mt-4 border-t border-[#e9edf2] pt-4' : 'mt-2';
  const textClass = 'whitespace-pre-wrap break-words text-[11px] leading-[1.65] text-[#1e1e20]';
  if (!longValue) return <div className={spacing}><div className="rounded-[12px] border border-[#e9edf2] bg-white p-4"><p className={textClass}>{value}</p></div></div>;
  return <div className={spacing}><div className="rounded-[12px] border border-[#e9edf2] bg-white p-4"><div className="flex justify-end border-b border-[#e9edf2] pb-3"><button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#3a427b]"><span>{expanded ? 'Свернуть' : 'Развернуть'}</span><svg aria-hidden="true" viewBox="0 0 18 18" className={`h-[14px] w-[14px] fill-none stroke-current stroke-[1.8] transition-transform [stroke-linecap:round] [stroke-linejoin:round] ${expanded ? 'rotate-90' : ''}`}><path d="m7 4 5 5-5 5" /></svg></button></div><p className={`${expanded ? textClass : `${textClass} line-clamp-5`} mt-3`}>{value}</p></div></div>;
}
