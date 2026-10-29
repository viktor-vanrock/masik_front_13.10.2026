import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getBenchmarkGroups } from '@/api/catalog/benchmark-groups/requests';
import { translations } from '@/i18n';
import { Dashboard } from './index';
import { RunResult } from '../RunResult';
import type { BenchmarkGroupsResponse, BenchmarkScore } from '@/types';

vi.mock('@/api/catalog/benchmark-groups/requests', () => ({ getBenchmarkGroups: vi.fn() }));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: 'ru', t: translations.ru }) }));
vi.mock('@/context/auth', () => ({ useAuth: () => ({ status: 'anonymous', user: null }) }));
vi.mock('@/api/metrics', () => ({ useMetricModelsQuery: () => ({ data: [], isPending: false, isError: false, error: null, refetch: vi.fn() }) }));
vi.mock('@/api/leaderboardBoards', () => ({
  useLeaderboardBoardsQuery: () => ({ data: [{
    id: 'general', systemKey: 'general', name: 'Общий рейтинг', description: null,
    modelIds: [], benchmarkIds: [], architectures: [], isPublic: true,
  }] }),
  useCreateLeaderboardBoardMutation: () => ({ mutate: vi.fn() }),
  useUpdateLeaderboardBoardMutation: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/hooks/useCssColors', () => ({ useCssColors: () => ['blue'] }));
vi.mock('recharts', () => ({
  BarChart: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null, ResponsiveContainer: () => null,
  Cell: () => null, ReferenceLine: () => null,
}));

const score = (modelId: string, modelName: string, value: number): BenchmarkScore => ({
  modelId, modelName, metricId: 'accuracy', metricName: 'Accuracy', score: value,
  isOpenSource: false, isHumanBaseline: false, sourceMode: 'benchmark',
  obtainedAt: '2026-10-23T00:00:00Z',
});

const page = (pageNumber: number, scores: BenchmarkScore[]): BenchmarkGroupsResponse => ({
  total: 2,
  data: [{
    benchmark: { id: `suite-${pageNumber}`, name: `Suite ${pageNumber}`, nameEn: `Suite ${pageNumber}` },
    tests: [{ id: `test-${pageNumber}`, name: `Test ${pageNumber}`, nameEn: `Test ${pageNumber}`, scores }],
  }],
}) as unknown as BenchmarkGroupsResponse;

const firstPage = page(1, [score('first', 'First Model', 80)]);
const secondPage = page(2, [score('second', 'Second Model', 90)]);

function renderPage(element: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={element} />
          <Route path="/run-result/:modelId" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, client };
}

describe('Leaderboard catalogue pagination', () => {
  beforeEach(() => vi.mocked(getBenchmarkGroups).mockReset());
  afterEach(() => vi.clearAllMocks());

  it('keeps RunResult loading until a model on the second page is available', async () => {
    let releaseSecondPage!: (value: BenchmarkGroupsResponse) => void;
    const pendingSecondPage = new Promise<BenchmarkGroupsResponse>((resolve) => { releaseSecondPage = resolve; });
    vi.mocked(getBenchmarkGroups).mockImplementation(({ page: pageNumber } = { page: 1 }) =>
      pageNumber === 1 ? Promise.resolve(firstPage) : pendingSecondPage);

    renderPage(<RunResult />, '/run-result/second');
    await waitFor(() => expect(getBenchmarkGroups).toHaveBeenCalledTimes(2));
    expect(screen.getByText(translations.ru.runResult.loading)).toBeInTheDocument();
    expect(screen.queryByText(translations.ru.runResult.notFound)).not.toBeInTheDocument();

    releaseSecondPage(secondPage);
    expect(await screen.findByRole('heading', { name: 'Second Model' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: translations.ru.runResult.resultsRegion })).toHaveTextContent('90.0%');
    expect(screen.queryByRole('button', { name: translations.ru.runResult.newRun })).not.toBeInTheDocument();
  });

  it('shows a second-page error and stops fetching further pages', async () => {
    vi.mocked(getBenchmarkGroups).mockImplementation(({ page: pageNumber } = { page: 1 }) =>
      pageNumber === 1 ? Promise.resolve(firstPage) : Promise.reject(new Error('Second page failed')));

    renderPage(<RunResult />, '/run-result/second');
    expect(await screen.findByText('Second page failed', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(getBenchmarkGroups).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(translations.ru.runResult.notFound)).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(getBenchmarkGroups).toHaveBeenCalledTimes(3);
  });

  it('includes models from every loaded page on Dashboard', async () => {
    vi.mocked(getBenchmarkGroups).mockImplementation(({ page: pageNumber } = { page: 1 }) =>
      Promise.resolve(pageNumber === 1 ? firstPage : secondPage));

    renderPage(<Dashboard />);
    const table = await screen.findByRole('table');
    await waitFor(() => expect(within(table).getByText('Second Model')).toBeInTheDocument());
    expect(within(table).getByText('First Model')).toBeInTheDocument();
    expect(getBenchmarkGroups).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Бюджет' })).not.toBeInTheDocument();
  });
});
