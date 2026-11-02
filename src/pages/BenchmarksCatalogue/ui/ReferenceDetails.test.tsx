import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BenchmarkSuite, BenchmarkType } from '@/types';
import { ReferenceSuiteDetail } from './ReferenceSuiteDetail';
import { ReferenceTestDetail } from './ReferenceTestDetail';

const state = vi.hoisted(() => ({
  tests: [] as BenchmarkType[], suite: {} as BenchmarkSuite,
  authStatus: 'authenticated', publicEnabled: true, ownEnabled: false,
  pending: false, failed: false, hasNextPage: false, retrySuite: vi.fn(), retryGroups: vi.fn(),
}));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: 'ru', status: state.authStatus, user: { id: 'author' } }) }));
vi.mock('@/api/catalog', () => ({
  useBenchmarkQuery: ({ enabled }: { enabled: boolean }) => { state.publicEnabled = enabled; return { data: enabled ? state.tests[0] : undefined, isPending: false }; },
  useMyCatalogSubmissionQuery: ({ enabled }: { enabled: boolean }) => { state.ownEnabled = enabled; return { data: enabled ? state.tests[0] : undefined, isPending: !enabled }; },
  useSuiteQuery: () => ({ data: state.suite, isPending: false, refetch: state.retrySuite }),
  useBenchmarkGroupsQuery: () => ({ data: { pages: [{ data: [{ benchmark: state.suite, tests: state.tests }] }] }, isPending: state.pending, isError: state.failed, hasNextPage: state.hasNextPage, refetch: state.retryGroups }),
}));

function benchmark(id: string): BenchmarkType {
  return {
    id, suiteId: 'suite', name: `Тест ${id}`, nameEn: `Test ${id}`, description: `Описание ${id}`, descriptionEn: '',
    codebase: { name: '', url: '' }, metrics: ['Accuracy'], examples: [], datasetSubsamples: [],
    instructions: 'Инструкция', instructionsEn: '', references: [], links: [], macroGroup: null, taskType: null,
    language: { id: 'ru', name: 'Русский', nameEn: 'Russian' }, difficulty: null, subGroups: [], abilityTaxons: [], modalities: [], capabilities: [],
    domains: [], subdomains: [], skills: [], abilityTags: [], sizeInSamples: 100, medianSampleSizeWords: 0,
    requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 },
    scores: [], isGenerated: false,
  };
}
function Location() { const location = useLocation(); return <output aria-label="URL">{location.pathname}{location.search}</output>; }
function show(kind: 'suite' | 'test', entry?: string) {
  return render(<MemoryRouter initialEntries={[entry || (kind === 'suite' ? '/benchmark/suite?type=suite' : '/benchmark/a')]}><Location /><Routes><Route path="/benchmark/:id" element={kind === 'suite' ? <ReferenceSuiteDetail /> : <ReferenceTestDetail />} /><Route path="/catalog" element={<h1>Каталог</h1>} /><Route path="/login" element={<h1>Вход</h1>} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  state.tests = [benchmark('a'), benchmark('b')];
  state.suite = { id: 'suite', name: 'Набор', nameEn: 'Suite', description: 'Описание набора\nПолное описание', descriptionEn: null, benchmarkTestsCount: 2, createdAt: '', updatedAt: '' };
  state.pending = false; state.failed = false; state.hasNextPage = false;
  state.authStatus = 'authenticated'; state.publicEnabled = true; state.ownEnabled = false;
  state.retrySuite.mockClear(); state.retryGroups.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe('reference suite detail', () => {
  it('keeps the real composition, supports keyboard selection and tabs, and opens the selected test', () => {
    show('suite');
    const options = screen.getAllByRole('option');
    options[0].focus();
    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus(); expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Тест b' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть страницу теста' })).toHaveAttribute('href', '/benchmark/b');
    fireEvent.click(screen.getByRole('tab', { name: 'О наборе' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'pn-a');
    expect(screen.getByText('Полное описание')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'О наборе' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Состав · 2' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить набор' }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('/benchmark/suite?type=suite');
  });

  it('opens a test immediately on the mobile breakpoint', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: query === '(max-width: 980px)', media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(() => false) }));
    show('suite');
    fireEvent.click(screen.getAllByRole('option')[1]);
    expect(screen.getByLabelText('URL')).toHaveTextContent('/benchmark/b');
  });

  it('searches large compositions without dropping tests from the data or export', () => {
    state.tests = Array.from({ length: 9 }, (_, index) => benchmark(String(index)));
    state.suite.benchmarkTestsCount = 9;
    show('suite');
    fireEvent.change(screen.getByPlaceholderText('Найти тест'), { target: { value: 'Тест 7' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option')).toHaveTextContent('Тест 7');
    expect(screen.getAllByRole('option', { hidden: true })).toHaveLength(9);
  });

  it('shows a recoverable composition error even if another page was advertised', () => {
    state.failed = true; state.hasNextPage = true;
    show('suite');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(state.retrySuite).toHaveBeenCalledTimes(1); expect(state.retryGroups).toHaveBeenCalledTimes(1);
  });
});

describe('reference test detail', () => {
  it('opens an unpublished author submission through the private query only', () => {
    state.tests[0].catalogEntry = { id: 'entry', status: 'validation', authorId: 'author', sourceConversationId: null, rejectionReason: null, reviewedById: null, submittedAt: '', reviewedAt: null };
    show('test', '/benchmark/a?submission=mine');
    expect(state.publicEnabled).toBe(false); expect(state.ownEnabled).toBe(true);
    expect(screen.getByRole('heading', { name: 'Тест a' })).toBeInTheDocument();
    expect(screen.getByText('Ваш бенчмарк · на проверке')).toBeInTheDocument();
    expect(screen.getByText('На ручной проверке.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Другие тесты набора' })).not.toBeInTheDocument();
  });

  it('sends a guest private submission visit to login without making private or public reads', () => {
    state.authStatus = 'anonymous';
    show('test', '/benchmark/a?submission=mine');
    expect(state.publicEnabled).toBe(false); expect(state.ownEnabled).toBe(false);
    expect(screen.getByLabelText('URL')).toHaveTextContent('/login');
  });

  it('preserves top-level and prompt-only subsample examples, provenance, and all sources', () => {
    state.tests[0].examples = [{ input: 'Основной ввод', output: 'Основной ответ' }];
    state.tests[0].datasetSubsamples = [{ id: 'part', name: 'Проверочная часть', nameEn: 'Evaluation', split: 'test', sizeInSamples: 1, medianSampleSizeWords: 0, requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 }, examples: [{ input: 'Только ввод', output: '', explanation: 'Объяснение' }] }];
    state.tests[0].references = [{ title: 'Публикация', url: 'https://example.test/paper' }];
    state.tests[0].links = [{ title: 'Та же публикация', type: 'docs', url: 'https://example.test/paper' }];
    state.tests[0].codebase = { name: 'Репозиторий', url: 'https://github.com/example/repo' };
    const view = show('test');
    expect(view.container.querySelectorAll('.ex')).toHaveLength(2);
    expect(view.container.querySelector('.ex')).toHaveAttribute('open');
    expect(screen.getByText('Основной ввод')).toBeInTheDocument();
    expect(screen.getByText('Только ввод')).toBeInTheDocument();
    expect(screen.getByText('Подвыборка: Проверочная часть · test')).toBeInTheDocument();
    expect(screen.getByText('Объяснение')).toBeInTheDocument();
    expect(view.container.querySelectorAll('.links a')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Публикация/ })).toHaveAttribute('href', 'https://example.test/paper');
    expect(screen.getByRole('link', { name: /Репозиторий/ })).toHaveAttribute('rel', 'noopener noreferrer');
    const siblings = screen.getByRole('heading', { name: 'Другие тесты набора' }).closest('section')!;
    expect(within(siblings).getByRole('link', { name: /Тест b/ })).toHaveAttribute('href', '/benchmark/b');
    expect(screen.getByRole('link', { name: /Весь набор/ })).toHaveAttribute('href', '/benchmark/suite?type=suite');
    fireEvent.click(screen.getByRole('button', { name: 'Улучшить' }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('/benchmark/a');
    fireEvent.click(screen.getByRole('link', { name: 'Каталог' }));
    expect(screen.getByLabelText('URL')).toHaveTextContent('/catalog');
  });

  it('downloads the real DTO and shows the empty state only without examples', () => {
    let downloaded: Blob | undefined;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((blob: Blob) => { downloaded = blob; return 'blob:test'; }) });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    show('test');
    expect(screen.getByText('Примеры не приложены.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Скачать в JSON' }));
    expect(downloaded).toBeInstanceOf(Blob); expect(downloaded?.type).toBe('application/json');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('preserves literal escapes in JSON and code examples from both DTO levels', () => {
    const input = JSON.stringify({ text: 'Первая строка\nВторая\tстрока' }, null, 2);
    const output = String.raw`print("answer\nnext\tcolumn")`;
    const nestedInput = String.raw`const pattern = /\n|\t/;`;
    const nestedOutput = JSON.stringify({ code: 'def solve():\n\treturn "ok"' });
    state.tests[0].examples = [{ input, output }];
    state.tests[0].datasetSubsamples = [{ id: 'part', name: 'Код', nameEn: 'Code', sizeInSamples: 1, medianSampleSizeWords: 0, requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 }, examples: [{ input: nestedInput, output: nestedOutput }] }];
    const view = show('test');
    const rendered = [...view.container.querySelectorAll('.ex pre')].map(element => element.textContent);
    expect(rendered).toEqual([input, output, nestedInput, nestedOutput]);
    expect(JSON.parse(rendered[0]!)).toEqual({ text: 'Первая строка\nВторая\tстрока' });
    expect(JSON.parse(rendered[3]!)).toEqual({ code: 'def solve():\n\treturn "ok"' });
  });
});
