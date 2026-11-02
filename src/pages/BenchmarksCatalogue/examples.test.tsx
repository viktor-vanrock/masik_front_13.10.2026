import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { BenchmarkExample, BenchmarkType, DatasetSubsample } from '@/types';
import { selectBenchmarkExamples } from '@/features/catalog/selectors';
import { RedesignedBenchmarkDetail } from './Catalog';
import { ReferenceTestDetail } from './ui/ReferenceTestDetail';
import { Route, Routes } from 'react-router-dom';

const state = vi.hoisted(() => ({ benchmark: {} as BenchmarkType }));
const suite = { id: 'suite', name: 'Набор', nameEn: 'Suite', description: 'Описание набора', benchmarkTestsCount: 1 };
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: 'ru' }) }));
vi.mock('@/api/analytics', () => ({ useCatalogAnalyticsTracking: () => {} }));
vi.mock('@/api/catalog', () => ({
  useMyCatalogSubmissionsQuery: () => ({}),
  useBenchmarkQuery: () => ({ data: state.benchmark }),
  useMyCatalogSubmissionQuery: () => ({}),
  useSuiteQuery: () => ({ data: suite }),
  useSuitesQuery: () => ({ data: { data: [suite] } }),
  useFilterOptionsQuery: () => ({}),
  useBenchmarkGroupsQuery: () => ({ data: { pages: [{ data: [{ benchmark: suite, tests: [state.benchmark] }] }] } }),
}));

const top: BenchmarkExample = { input: 'Общий пример', output: 'Общий ответ' };
const nested: BenchmarkExample = { input: 'Пример подвыборки', output: '', explanation: 'Пояснение примера' };
const subsample: DatasetSubsample = {
  id: 'part-1', name: 'Проверочная часть', nameEn: 'Evaluation split', split: 'test',
  sizeInSamples: 100, medianSampleSizeWords: 0,
  requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 },
  examples: [nested],
};

function benchmark(examples: BenchmarkExample[], datasetSubsamples: DatasetSubsample[]): BenchmarkType {
  return {
    id: 'test', suiteId: 'suite', name: 'Тест', nameEn: 'Test', description: 'Описание', descriptionEn: '',
    codebase: { name: '', url: '' }, metrics: [], examples, datasetSubsamples,
    instructions: '', instructionsEn: '', references: [], links: [], macroGroup: null, taskType: null,
    language: null, difficulty: null, subGroups: [], abilityTaxons: [], modalities: [], capabilities: [],
    domains: [], subdomains: [], skills: [], abilityTags: [], sizeInSamples: 100, medianSampleSizeWords: 0,
    requestLengthDist: { min: 0, median: 0, max: 0 }, responseLengthDist: { min: 0, median: 0, max: 0 },
    scores: [], isGenerated: false,
  };
}

describe('reference full-page examples', () => {
  function open(data: BenchmarkType) {
    state.benchmark = data;
    return render(<MemoryRouter initialEntries={['/benchmark/test']}><Routes><Route path="/benchmark/:id" element={<ReferenceTestDetail />} /></Routes></MemoryRouter>).container;
  }
  it('keeps prompt-only examples and their subsample provenance', () => {
    const region = within(open(benchmark([], [subsample])));
    expect(region.getByText(nested.input)).toBeInTheDocument();
    expect(region.getByText('Подвыборка: Проверочная часть · test')).toBeInTheDocument();
    expect(region.getByText(nested.explanation!)).toBeInTheDocument();
  });
  it('shows every example from both levels and its answer', () => {
    const region = within(open(benchmark([top], [subsample])));
    expect(region.getByText(top.input)).toBeInTheDocument();
    expect(region.getByText(top.output)).toBeInTheDocument();
    expect(region.getByText(nested.input)).toBeInTheDocument();
    expect(region.getAllByText(/^Пример \d$/)).toHaveLength(2);
  });
});

it('preserves duplicate content in different parts, source order and localized provenance', () => {
  const data = benchmark([top], [subsample, { ...subsample, id: 'part-2', nameEn: 'Training split', split: 'train' }]);
  const before = structuredClone(data);
  const selected = selectBenchmarkExamples(data, 'en');
  expect(selected.map(({ example }) => example)).toEqual([top, nested, nested]);
  expect(selected.map(({ sourceLabel }) => sourceLabel)).toEqual([
    null, 'Subset: Evaluation split · test', 'Subset: Training split · train',
  ]);
  expect(new Set(selected.map(({ key }) => key)).size).toBe(3);
  expect(data).toEqual(before);
});

function CurrentPath() { return <output aria-label="Текущий путь">{useLocation().pathname}</output>; }

it.each(['detail', 'suite'] as const)('returns from %s to /catalog through its catalog breadcrumb', (view) => {
  state.benchmark = benchmark([], []);
  render(<MemoryRouter initialEntries={[view === 'suite' ? '/benchmark/suite?type=suite' : '/benchmark/test']}>
    <CurrentPath />
    <Routes><Route path="/benchmark/:id" element={view === 'suite' ? <RedesignedBenchmarkDetail /> : <ReferenceTestDetail />} /></Routes>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: 'Каталог' }));
  expect(screen.getByLabelText('Текущий путь')).toHaveTextContent('/catalog');
});
