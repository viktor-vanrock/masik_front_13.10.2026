import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BenchmarkGroup, BenchmarkTestFilterOptions, BenchmarkTestListQuery, BenchmarkType, DictionaryRef } from '@/types';
import { Catalog } from './Catalog';

const state = vi.hoisted(() => ({
  options: undefined as BenchmarkTestFilterOptions | undefined,
  query: {} as BenchmarkTestListQuery,
  groups: [] as BenchmarkGroup[],
  lang: 'ru',
}));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: state.lang }) }));
vi.mock('@/api/analytics', () => ({ useCatalogAnalyticsTracking: () => {} }));
vi.mock('@/api/catalog', () => ({
  useMyCatalogSubmissionsQuery: () => ({}),
  useFilterOptionsQuery: () => ({ data: state.options }),
  useSuitesQuery: () => ({ data: { data: state.groups.map(group => group.benchmark) } }),
  useBenchmarkGroupsQuery: (query: BenchmarkTestListQuery, options: { enabled?: boolean }) => {
    if (options.enabled === undefined) state.query = query;
    return { data: { pages: [{ data: state.groups }] }, isPending: false, isError: false };
  },
}));

function dictionaries(russian = 'Русский'): BenchmarkTestFilterOptions {
  return {
    languages: [{ id: 'server-russian-id', name: russian, nameEn: 'Russian' }, { id: 'server-english-id', name: 'English', nameEn: 'English' }],
    difficulties: [{ id: 'advanced-id', name: 'Продвинутый', nameEn: 'Advanced' }],
    modalities: [], taskTypes: [], capabilities: [], domains: [], subdomains: [], macroGroups: [], subGroups: [], abilityTaxons: [], abilityTags: [], skills: [],
  };
}

function benchmark(id: string, fields: Partial<BenchmarkType> = {}): BenchmarkType {
  return {
    id, suiteId: 'suite', name: `Тест ${id}`, nameEn: `Test ${id}`, description: '', descriptionEn: '',
    codebase: { name: '', url: '' }, metrics: [], examples: [], datasetSubsamples: [], instructions: '', instructionsEn: '',
    references: [], links: [], macroGroup: null, taskType: null, language: null, difficulty: null, subGroups: [], abilityTaxons: [],
    modalities: [], capabilities: [], domains: [], subdomains: [], skills: [], abilityTags: [], sizeInSamples: 0, medianSampleSizeWords: 0,
    requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 },
    scores: [], isGenerated: false, ...fields,
  };
}

function setSuite(tests: BenchmarkType[], name = 'Банковская корзина', nameEn = 'Banking basket') {
  state.groups = [{ benchmark: { id: 'suite', name, nameEn, description: null, descriptionEn: null, benchmarkTestsCount: tests.length, matchedTestsCount: tests.length }, tests }];
}

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <output aria-label="URL">{location.pathname}{location.search}</output>
    <button onClick={() => navigate('/catalog?search=агент&language=ru')}>Другой запрос</button>
    <button onClick={() => navigate(-1)}>Назад</button>
    <button onClick={() => navigate(1)}>Вперёд</button>
  </>;
}

function View({ entry }: { entry: string }) {
  return <MemoryRouter initialEntries={[entry]}><Navigation /><Catalog /></MemoryRouter>;
}
const input = () => screen.getByPlaceholderText('Название, метрика, домен…');
const waitForSearch = () => act(() => vi.advanceTimersByTime(500));
const urlParams = () => new URLSearchParams(screen.getByLabelText('URL').textContent!.split('?')[1]);

beforeEach(() => { vi.useFakeTimers(); state.options = dictionaries(); state.query = {}; state.groups = []; state.lang = 'ru'; vi.spyOn(window, 'scrollTo').mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('catalog URL entry from the oracle', () => {
  it.each(['рассужд', 'код', 'данн', 'агент', 'финанс'])('uses the HTML search token %s on initial mount', (search) => {
    render(<View entry={`/catalog?search=${encodeURIComponent(search)}`} />);
    expect(input()).toHaveValue(search);
    expect(state.query.search).toBe(search);
  });

  it.each(['Русский', 'ru', 'ru-RU'])('resolves language=ru using the current %s dictionary entry', (name) => {
    state.options = dictionaries(name);
    render(<View entry="/catalog?language=ru" />);
    expect(state.query.languageIds).toEqual(['server-russian-id']);
    const chips = screen.getByLabelText('Применённые фильтры');
    expect(within(chips).getByText(name)).toBeInTheDocument();
  });

  it('resolves a Russian dictionary through its English name in an English interface', () => {
    state.lang = 'en';
    state.options = dictionaries('ru-RU');
    render(<View entry="/catalog?language=ru" />);
    expect(state.query.languageIds).toEqual(['server-russian-id']);
    const chips = screen.getByLabelText('Применённые фильтры');
    expect(within(chips).getByText('Russian')).toBeInTheDocument();
  });

  it('reads navigation and Back/Forward without requiring a remount', () => {
    render(<View entry="/catalog?search=код" />);
    fireEvent.click(screen.getByRole('button', { name: 'Другой запрос' }));
    expect(input()).toHaveValue('агент');
    waitForSearch();
    expect(state.query).toMatchObject({ search: 'агент', languageIds: ['server-russian-id'] });
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(input()).toHaveValue('код');
    waitForSearch();
    expect(state.query.search).toBe('код');
    expect(state.query.languageIds).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
    waitForSearch();
    expect(state.query).toMatchObject({ search: 'агент', languageIds: ['server-russian-id'] });
  });

  it('preserves user edits and other filters while late dictionaries resolve the incoming language', () => {
    state.options = undefined;
    const view = render(<View entry="/catalog?search=код&language=ru&source=orb" />);
    fireEvent.change(input(), { target: { value: 'мой запрос' } });
    fireEvent.click(screen.getByRole('button', { name: /^Фильтры/ }));
    state.options = dictionaries();
    view.rerender(<View entry="/catalog?search=код&language=ru&source=orb" />);
    expect(input()).toHaveValue('мой запрос');
    const drawer = within(screen.getByRole('dialog', { name: 'Фильтры' }));
    expect(drawer.getByRole('button', { name: /^Русский/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(drawer.getByRole('button', { name: /^English/ }));
    fireEvent.click(drawer.getByRole('button', { name: /^Русский/ }));
    fireEvent.click(drawer.getByRole('button', { name: /^Продвинутый/ }));
    fireEvent.click(drawer.getByRole('button', { name: /^Показать/ }));
    waitForSearch();
    expect(state.query).toMatchObject({ search: 'мой запрос', languageIds: ['server-english-id'], difficultyIds: ['advanced-id'] });
    state.options = dictionaries('ru-RU');
    view.rerender(<View entry="/catalog?search=код&language=ru&source=orb" />);
    expect(input()).toHaveValue('мой запрос');
    expect(state.query.languageIds).toEqual(['server-english-id']);
    expect(urlParams().get('source')).toBe('orb');
  });

  it('clears language through its chip and clears query on reset', () => {
    render(<View entry="/catalog?search=код&language=ru&source=orb" />);
    fireEvent.click(within(screen.getByLabelText('Применённые фильтры')).getByRole('button', { name: 'Убрать фильтр Русский' }));
    expect(urlParams().has('language')).toBe(false);
    expect(state.query.languageIds).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Другой запрос' }));
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё' }));
    waitForSearch();
    expect(input()).toHaveValue('');
    expect(urlParams().has('search')).toBe(false);
    expect(urlParams().has('language')).toBe(false);
    expect(state.query.search).toBeUndefined();
    expect(state.query.languageIds).toBeUndefined();
  });
});

describe('catalog results and facet counts', () => {
  it.each(['Банковская корзина', 'Banking basket'])('finds a suite by %s when its tests do not repeat the name', (search) => {
    setSuite([benchmark('a'), benchmark('b')]);
    render(<View entry={`/catalog?search=${encodeURIComponent(search)}`} />);
    expect(screen.getByText('Найдено 2 теста', { selector: '[role="status"]' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тест a/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тест b/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Фильтры/ }));
    expect(screen.getByRole('button', { name: 'Показать 2 теста' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Банковская корзина/ }).closest('label')).toHaveTextContent('2');
  });

  it('searches the modality like the source catalog', () => {
    setSuite([benchmark('a', { modalities: [{ id: 'audio', name: 'Аудио', nameEn: 'Audio' }] }), benchmark('b')]);
    render(<View entry="/catalog?search=аудио" />);
    expect(screen.getByText('Найдено 1 тест', { selector: '[role="status"]' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тест a/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Тест b/ })).not.toBeInTheDocument();
  });

  it('intersects ability groups, taxons and tags while keeping parent and child alternatives', () => {
    const ref = (id: string, name: string): DictionaryRef => ({ id, name, nameEn: name });
    const agentic = ref('agentic', 'Agentic'), text = ref('text', 'Text'), other = ref('other', 'Other');
    const sub = { ...ref('sub', 'Text subgroup'), macroGroupId: text.id };
    const planning = ref('planning', 'Planning'), coding = ref('coding', 'Coding');
    state.options = { ...dictionaries(), macroGroups: [agentic, text, other], subGroups: [sub], abilityTaxons: [planning, coding], abilityTags: ['Tool use', 'Temporal'] };
    setSuite([
      benchmark('match', { macroGroup: agentic, abilityTaxons: [planning], abilityTags: ['Tool use'] }),
      benchmark('child', { macroGroup: text, subGroups: [sub], abilityTaxons: [planning], abilityTags: ['Tool use'] }),
      benchmark('wrong-taxon', { macroGroup: agentic, abilityTaxons: [coding], abilityTags: ['Tool use'] }),
      benchmark('wrong-tag', { macroGroup: agentic, abilityTaxons: [planning], abilityTags: ['Temporal'] }),
      benchmark('wrong-group', { macroGroup: other, abilityTaxons: [planning], abilityTags: ['Tool use'] }),
    ]);
    render(<View entry="/catalog" />);
    fireEvent.click(screen.getByRole('button', { name: /^Фильтры/ }));
    fireEvent.click(screen.getByText('Классификация способностей', { selector: 'summary' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Agentic/ }));
    expect(screen.getByRole('button', { name: 'Показать 3 теста' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Planning/ }).closest('label')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('checkbox', { name: /^Planning/ }));
    expect(screen.getByRole('button', { name: 'Показать 2 теста' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Детальные теги способности', { selector: 'summary' }));
    expect(screen.getByRole('checkbox', { name: /^Tool use/ }).closest('label')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('checkbox', { name: /^Tool use/ }));
    expect(screen.getByRole('button', { name: 'Показать 1 тест' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Развернуть «Text»' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Text subgroup/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Показать 2 теста' }));
    expect(screen.getByText('Найдено 2 теста', { selector: '[role="status"]' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тест match/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Тест child/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Тест wrong-/ })).not.toBeInTheDocument();
  });
});
