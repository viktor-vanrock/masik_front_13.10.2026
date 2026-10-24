import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { translations } from '@/i18n';
import type { BenchmarkType, MetricResult } from '@/types';
import { Dashboard } from './index';
import { RunResult } from '../RunResult';
import { ScoresTab } from '../BenchmarkDetail/Tabs/ScoresTab';

const fixtures = vi.hoisted(() => {
  const model = { id: 'model', name: 'Diffusion Model', provider: null, architecture: 'text-diffusion', isOpenSource: false, createdAt: '', updatedAt: '' };
  const score = { modelId: model.id, modelName: model.name, metricId: 'accuracy', metricName: 'Accuracy', architecture: model.architecture, isOpenSource: false, isHumanBaseline: false };
  const test = { id: 'test', name: 'Test', nameEn: 'Test', sizeInSamples: 1, scores: [
    { ...score, score: 90, auqtc: 0.9, sourceMode: 'benchmark', obtainedAt: '2026-10-23T00:00:00Z' },
    { ...score, score: 30, auqtc: 0.3, sourceMode: 'harness', obtainedAt: '2026-10-22T00:00:00Z' },
    { ...score, modelId: 'benchmark-only', modelName: 'Benchmark Only', score: 80, sourceMode: 'benchmark', obtainedAt: '2026-10-23T00:00:00Z' },
  ] };
  const boards = [
    { id: 'general', systemKey: 'general', name: 'Общий рейтинг', architectures: [] },
    { id: 'agents', systemKey: 'agent-systems', name: 'Агентные системы', architectures: [] },
    { id: 'alternative', systemKey: 'alternative-architectures', name: 'Альтернативные архитектуры', architectures: ['text-diffusion'] },
  ].map((board) => ({ ...board, modelIds: [], benchmarkIds: [], isPublic: true, description: null }));
  return {
    model, test, boards,
    models: [model, { ...model, id: 'benchmark-only', name: 'Benchmark Only', architecture: null }],
    groups: { pages: [{ data: [{ benchmark: { id: 'suite', name: 'Suite', nameEn: 'Suite' }, tests: [test] }] }] },
  };
});

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: 'ru', t: translations.ru }) }));
vi.mock('@/context/auth', () => ({ useAuth: () => ({ status: 'anonymous' }) }));
vi.mock('@/api/catalog', () => ({ useBenchmarkGroupsQuery: () => ({ data: fixtures.groups, isPending: false, isError: false }) }));
vi.mock('@/api/metrics', () => ({ useMetricModelsQuery: () => ({ data: fixtures.models, isPending: false, isError: false }) }));
vi.mock('@/api/leaderboardBoards', () => ({
  useLeaderboardBoardsQuery: () => ({ data: fixtures.boards }),
  useCreateLeaderboardBoardMutation: () => ({ mutate: vi.fn() }),
  useUpdateLeaderboardBoardMutation: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/hooks/useCssColors', () => ({ useCssColors: () => ['blue'] }));
vi.mock('recharts', () => ({
  BarChart: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null, ResponsiveContainer: () => null,
  Cell: () => null, ReferenceLine: () => null,
}));

describe('Rendered source mode views', () => {
  it('separates system tabs, excludes models without matching results and filters architectures', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByRole('table')).toHaveTextContent('90.0');
    expect(screen.getByRole('table')).toHaveTextContent('Benchmark Only');
    fireEvent.click(screen.getByRole('tab', { name: 'Агентные системы' }));
    expect(screen.getByRole('table')).toHaveTextContent('30.0');
    expect(screen.getByRole('table')).not.toHaveTextContent('90.0');
    expect(screen.getByRole('table')).not.toHaveTextContent('Benchmark Only');
    fireEvent.click(screen.getByRole('tab', { name: 'Альтернативные архитектуры' }));
    expect(screen.getByRole('table')).toHaveTextContent('90.0');
    expect(screen.getByRole('table')).not.toHaveTextContent('Benchmark Only');
  });

  it('renders the harness result selected by the URL without a mode selector', () => {
    render(<MemoryRouter initialEntries={['/run-result/model?sourceMode=harness']}>
      <Routes><Route path="/run-result/:modelId" element={<RunResult />} /></Routes>
    </MemoryRouter>);
    const metrics = screen.getByRole('region', { name: 'Результаты прогона' });
    expect(metrics).toHaveTextContent('30.0%');
    expect(metrics).toHaveTextContent('0.300');
    expect(metrics).not.toHaveTextContent('60.0%');
    expect(screen.queryByRole('combobox', { name: 'Режим результатов' })).not.toBeInTheDocument();
  });

  it('renders benchmark results when no mode is specified', () => {
    render(<MemoryRouter initialEntries={['/run-result/model']}>
      <Routes><Route path="/run-result/:modelId" element={<RunResult />} /></Routes>
    </MemoryRouter>);
    expect(screen.getByRole('region', { name: 'Результаты прогона' })).toHaveTextContent('90.0%');
  });

  it('shows an empty efficiency value when AUQTC is absent', () => {
    render(<MemoryRouter initialEntries={['/run-result/benchmark-only']}>
      <Routes><Route path="/run-result/:modelId" element={<RunResult />} /></Routes>
    </MemoryRouter>);
    expect(screen.getByText('Эффективность').closest('article')).toHaveTextContent('—');
  });

  it('renders ScoresTab benchmark results with the mode selector hidden', () => {
    const results = fixtures.test.scores.filter((score) => score.modelId === 'model').map((score, i) => ({
      id: String(i), modelId: score.modelId, metricId: score.metricId, sourceMode: score.sourceMode,
      value: score.score, obtainedAt: score.obtainedAt, model: fixtures.model,
      metric: { id: 'accuracy', name: 'Accuracy', direction: { code: 'higher_is_better' } },
    })) as MetricResult[];
    render(<ScoresTab benchmark={{ ...fixtures.test, metrics: ['Accuracy'] } as BenchmarkType}
      results={results} isPending={false} isError={false} error={null} onRetry={vi.fn()} />);
    expect(within(screen.getByRole('table')).getByText('90.00')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByText('30.00')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Режим результатов' })).not.toBeInTheDocument();
  });
});

