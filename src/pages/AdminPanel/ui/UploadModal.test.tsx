import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { BenchmarkType } from '@/types';
import { UploadModal } from './UploadModal';

const state = vi.hoisted(() => ({
  lang: 'ru' as 'ru' | 'en',
  mutate: vi.fn(),
  definitions: [
    { id: 'accuracy-id', name: 'accuracy', displayName: 'Accuracy' },
    { id: 'latency-id', name: 'latency', displayName: 'Latency' },
  ],
}));
vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations[state.lang], lang: state.lang }) }));
vi.mock('@/api/metrics', () => ({
  useMetricDefinitionsQuery: () => ({ isPending: false, data: { data: state.definitions } }),
  useMetricModelsQuery: () => ({ isPending: false, data: [{ id: 'model-id', name: 'Model' }] }),
  useCreateMetricResultMutation: () => ({ mutate: state.mutate, isPending: false, isError: false }),
}));

const benchmark = (metrics: string[]) => ({
  id: 'test-id', name: 'Тест', nameEn: 'Test', metrics,
}) as BenchmarkType;

beforeEach(() => {
  state.lang = 'ru';
  state.mutate.mockReset();
  state.definitions = [
    { id: 'accuracy-id', name: 'accuracy', displayName: 'Accuracy' },
    { id: 'latency-id', name: 'latency', displayName: 'Latency' },
  ];
});

describe('UploadModal metric assignment boundary', () => {
  it.each(['ru', 'en'] as const)('explains missing assignments and links to edit without allowing unassigned results (%s)', (lang) => {
    state.lang = lang;
    const t = translations[lang];
    renderWithProviders(<UploadModal uploadTarget={benchmark([])} setUploadTarget={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(t.admin.metricRequiredForResult);
    expect(screen.getByRole('link', { name: t.admin.editBenchmark })).toHaveAttribute('href', '/admin/edit/test-id');
    expect(screen.getByRole('combobox', { name: t.admin.metricField })).toBeDisabled();
    expect(screen.queryByRole('option', { name: 'Accuracy' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', { name: t.admin.metricValueField }), { target: { value: '0.7' } });
    const submit = screen.getByRole('button', { name: t.admin.uploadBtn });
    expect(submit).toBeDisabled();
    fireEvent.submit(submit.closest('form')!);
    expect(state.mutate).not.toHaveBeenCalled();
  });

  it('offers only assigned definitions and sends a Test-level result', () => {
    renderWithProviders(<UploadModal uploadTarget={benchmark(['accuracy'])} setUploadTarget={vi.fn()} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Accuracy' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Latency' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton', { name: translations.ru.admin.metricValueField }), { target: { value: '0.7' } });
    fireEvent.click(screen.getByRole('button', { name: translations.ru.admin.uploadBtn }));
    expect(state.mutate).toHaveBeenCalledWith({
      testId: 'test-id', metricId: 'accuracy-id', modelId: 'model-id', value: 0.7,
      obtainedAt: undefined, importSource: 'benchmark-catalog-admin',
    }, { onSuccess: expect.any(Function) });
  });

  it('distinguishes unavailable definitions from a missing assignment', () => {
    renderWithProviders(<UploadModal uploadTarget={benchmark(['unavailable-metric'])} setUploadTarget={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(translations.ru.admin.noMetricsForBenchmark);
    expect(screen.queryByText(translations.ru.admin.metricRequiredForResult)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: translations.ru.admin.uploadBtn })).toBeDisabled();
  });

  it('does not select an unassigned definition whose display label matches the assigned canonical name', () => {
    state.definitions = [
      { id: 'unassigned-id', name: 'legacy-accuracy', displayName: 'Accuracy score' },
      { id: 'assigned-id', name: 'Accuracy score', displayName: 'Accuracy score' },
    ];
    renderWithProviders(<UploadModal uploadTarget={benchmark(['Accuracy score'])} setUploadTarget={vi.fn()} />);
    const metric = screen.getByRole('combobox', { name: translations.ru.admin.metricField });
    expect(metric).toHaveValue('assigned-id');
    expect(screen.getAllByRole('option', { name: 'Accuracy score' })).toHaveLength(1);
    fireEvent.change(screen.getByRole('spinbutton', { name: translations.ru.admin.metricValueField }), { target: { value: '87.25' } });
    fireEvent.click(screen.getByRole('button', { name: translations.ru.admin.uploadBtn }));
    expect(state.mutate).toHaveBeenCalledWith(expect.objectContaining({
      testId: 'test-id', metricId: 'assigned-id', value: 87.25,
    }), { onSuccess: expect.any(Function) });
  });

  it('keeps distinct canonical names that differ only by case separate', () => {
    state.definitions = [
      { id: 'lowercase-id', name: 'accuracy', displayName: 'Lowercase accuracy' },
      { id: 'assigned-id', name: 'Accuracy', displayName: 'Assigned accuracy' },
    ];
    renderWithProviders(<UploadModal uploadTarget={benchmark(['Accuracy'])} setUploadTarget={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: translations.ru.admin.metricField })).toHaveValue('assigned-id');
    expect(screen.queryByRole('option', { name: 'Lowercase accuracy' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Assigned accuracy' })).toBeInTheDocument();
  });
});
