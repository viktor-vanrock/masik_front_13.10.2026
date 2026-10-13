import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ConversationGenerationDto, ConversationProductionDto } from '@/api/conversations';
import { translations } from '@/i18n';
import { GenerationPanel } from './GenerationPanel';

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru }) }));

const base: ConversationGenerationDto = {
  jobId: 'job-1', status: 'queued',
  progress: { phase: null, completedGenerations: 0, totalGenerations: 3 },
  examples: [], error: null,
};
const props = { loadError: false, retryError: false, isRetrying: false, onRetry: vi.fn(), onRefresh: vi.fn(),
  onCancel: vi.fn(), isCancelling: false, cancelError: false,
  productionLoading: false, productionError: false, onProductionRefresh: vi.fn(), onStartProduction: vi.fn(),
  isStartingProduction: false, startProductionError: false };

const production: ConversationProductionDto = {
  jobId: 'production-1', status: 'running', requestedCount: 250, generatedCount: 40,
  examples: [], error: null,
};

describe('GenerationPanel', () => {
  it.each(['queued', 'running'] as const)('allows cancellation for %s jobs and disables duplicate clicks', (status) => {
    const onCancel = vi.fn();
    const { rerender } = render(<GenerationPanel {...props} onCancel={onCancel} generation={{ ...base, status }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Отменить генерацию' }));
    expect(onCancel).toHaveBeenCalledOnce();
    rerender(<GenerationPanel {...props} isCancelling generation={{ ...base, status }} />);
    expect(screen.getByRole('button', { name: 'Отменяем…' })).toBeDisabled();
  });

  it('shows cancellation errors and allows a cancelled job to restart without progress or ETA', () => {
    const { rerender } = render(<GenerationPanel {...props} cancelError generation={{ ...base, status: 'running' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось отменить генерацию');
    rerender(<GenerationPanel {...props} generation={{ ...base, status: 'cancelled' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Генерация отменена');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить генерацию' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить генерацию' })).toBeInTheDocument();
  });
  it('shows mutation capacity and waits for a measured ETA', () => {
    render(<GenerationPanel {...props} generation={{ ...base, status: 'running', progress: {
      ...base.progress, completedLlmCalls: 0, totalLlmCalls: 12, estimatedCompletionAt: null,
    } }} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '12');
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    expect(screen.getByText('Завершено вызовов LLM: 0 / максимум 12')).toBeInTheDocument();
    expect(screen.getByText('Оцениваем оставшееся время…')).toBeInTheDocument();
  });

  it('counts ETA down between polls and acknowledges an overdue estimate', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-22T12:00:00Z'));
    try {
      render(<GenerationPanel {...props} generation={{ ...base, status: 'running', progress: {
        ...base.progress, completedLlmCalls: 3, totalLlmCalls: 12,
        estimatedCompletionAt: '2026-09-22T12:02:05Z',
      } }} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('Примерно осталось: 3 мин')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(60_000));
      expect(screen.getByText('Примерно осталось: 2 мин')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(66_000));
      expect(screen.getByText(/Генерация занимает больше времени/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows finalization instead of a stale ETA while publishing', () => {
    render(<GenerationPanel {...props} generation={{ ...base, status: 'running', progress: {
      ...base.progress, phase: 'publishing', completedLlmCalls: 3, totalLlmCalls: 12,
      estimatedCompletionAt: '2026-09-22T15:00:00Z',
    } }} />);
    expect(screen.getByText('Завершаем проверки и сохраняем результат…')).toBeInTheDocument();
    expect(screen.queryByText(/Примерно осталось/)).not.toBeInTheDocument();
  });

  it('uses calls rather than mutations and does not finalize at the estimated budget', () => {
    render(<GenerationPanel {...props} generation={{ ...base, status: 'running', progress: {
      ...base.progress, completedMutations: 1, totalMutations: 1,
      completedLlmCalls: 14, totalLlmCalls: 12,
    } }} />);
    expect(screen.getByText('Завершено вызовов LLM: 14 / максимум 12')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '12');
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '12');
    expect(screen.queryByText('Завершаем проверки и сохраняем результат…')).not.toBeInTheDocument();
    expect(screen.getByText(/Генерация занимает больше времени/)).toBeInTheDocument();
  });

  it('shows progress and every generated task after completion', () => {
    const { rerender } = render(<GenerationPanel {...props} generation={{ ...base, status: 'running' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Изобретатель создаёт');
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '3');
    rerender(<GenerationPanel {...props} generation={{ ...base, status: 'succeeded', examples: [
      { input: 'Вопрос первый', output: 'Ответ первый' },
      { input: 'Вопрос второй', output: 'Ответ второй' },
      { input: 'Вопрос третий', output: 'A', task: { question: 'Вопрос третий', choices: ['Первый вариант', 'Второй вариант'], correct_answer: 'A' } },
      { input: 'Вопрос четвертый', output: 'Ответ четвертый' },
    ] }} />);
    expect(screen.getAllByRole('article')).toHaveLength(4);
    expect(screen.getByText('Ответ четвертый')).toBeInTheDocument();
    expect(screen.getByText(/Вопрос третий/)).toHaveTextContent('B. Второй вариант');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('displays failure and lets the user retry the job', () => {
    const onRetry = vi.fn();
    render(<GenerationPanel {...props} onRetry={onRetry} generation={{ ...base, status: 'failed', error: { code: 'invalid_tasks', message: 'Проверка заданий не пройдена' } }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Проверка заданий не пройдена');
    fireEvent.click(screen.getByRole('button', { name: 'Повторить генерацию' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText('Задания созданы')).not.toBeInTheDocument();
  });

  it('starts production with the requested count and selected seed task indices', () => {
    const onStartProduction = vi.fn();
    render(<GenerationPanel {...props} onStartProduction={onStartProduction}
      generation={{ ...base, status: 'succeeded', examples: [
        { input: 'Seed 1', output: 'Answer 1' },
        { input: 'Seed 2', output: 'Answer 2' },
        { input: 'Seed 3', output: 'Answer 3' },
      ] }} />);
    expect(screen.getByText('Выбрано заданий: 3 из 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 2' }));
    expect(screen.getByText('Выбрано заданий: 2 из 3')).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: 'Количество примеров (до 1000)' });
    expect(slider).toHaveAttribute('max', '1000');
    fireEvent.change(slider, { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Масштабировать' }));
    expect(onStartProduction).toHaveBeenCalledWith(250, 'job-1', [0, 2]);
  });

  it('requires at least one selected task before production', () => {
    render(<GenerationPanel {...props} generation={{ ...base, status: 'succeeded', examples: [{ input: 'Seed' }] }} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 1' }));
    expect(screen.getByRole('button', { name: 'Масштабировать' })).toBeDisabled();
    expect(screen.getByText('Выберите хотя бы одно задание для масштабирования.')).toBeInTheDocument();
  });

  it('resets selection for a new generation and restores persisted selection for a production job', () => {
    const generation = { ...base, status: 'succeeded' as const, examples: [{ input: 'One' }, { input: 'Two' }] };
    const { rerender } = render(<GenerationPanel {...props} generation={generation} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 1' }));
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();
    rerender(<GenerationPanel {...props} generation={{ ...generation, jobId: 'job-2' }} />);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).toBeChecked();
    rerender(<GenerationPanel {...props} generation={{ ...generation, jobId: 'job-2' }}
      production={{ ...production, selectedIndices: [1] }} />);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 2' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 2' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Масштабировать' })).toBeDisabled();
  });

  it('allows a failed production job to retry with a changed selection and count', () => {
    const onStartProduction = vi.fn();
    const generation = { ...base, status: 'succeeded' as const, examples: [{ input: 'One' }, { input: 'Two' }] };
    const failed = { ...production, status: 'failed' as const, selectedIndices: [1] };
    render(<GenerationPanel {...props} onStartProduction={onStartProduction} generation={generation} production={failed} />);
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 1' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Выбрать задание 2' })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 1' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 2' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Масштабировать' }));
    expect(onStartProduction).toHaveBeenCalledWith(300, 'job-1', [0]);
  });

  it('shows producer progress against requested examples and disables another run', () => {
    render(<GenerationPanel {...props} production={production}
      generation={{ ...base, status: 'succeeded', examples: [{ input: 'Seed', output: 'Answer' }] }} />);
    expect(screen.getByText('Создано примеров: 40 / 250')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Создано примеров' })).toHaveAttribute('max', '250');
    expect(screen.getByRole('progressbar', { name: 'Создано примеров' })).toHaveAttribute('value', '40');
    expect(screen.getByRole('button', { name: 'Масштабировать' })).toBeDisabled();
  });

  it('limits the completed producer preview to ten examples', () => {
    const examples = Array.from({ length: 12 }, (_, index) => ({ input: `Produced ${index}`, output: `Answer ${index}` }));
    render(<GenerationPanel {...props} production={{ ...production, status: 'succeeded', generatedCount: 12, examples }}
      generation={{ ...base, status: 'succeeded', examples: [{ input: 'Seed', output: 'Answer' }] }} />);
    fireEvent.click(screen.getByText('Примеры: первые 10'));
    expect(screen.getByText('Produced 9')).toBeInTheDocument();
    expect(screen.queryByText('Produced 10')).not.toBeInTheDocument();
  });

  it('shows the accepted count instead of unfinished progress when validation filters examples', () => {
    const examples = Array.from({ length: 8 }, (_, index) => ({ input: `Produced ${index}`, output: `Answer ${index}` }));
    render(<GenerationPanel {...props} production={{ ...production, status: 'succeeded', requestedCount: 12,
      generatedCount: 8, examples }} generation={{ ...base, status: 'succeeded',
      examples: [{ input: 'Seed', output: 'Answer' }] }} />);

    expect(screen.getByText('Масштабирование завершено.')).toBeInTheDocument();
    expect(screen.getByText('Прошли проверки: 8 из 12 примеров.')).toBeInTheDocument();
    expect(screen.getByText('Отфильтровано: 4.')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: 'Создано примеров' })).not.toBeInTheDocument();
    expect(screen.queryByText('66%')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скачать все примеры (.jsonl)' })).toBeEnabled();
  });
});

describe('GenerationPanel equal variants for selected sources', () => {
  it('recalculates valid counts when a seed is deselected and sends the selected indices', () => {
    const onStartProduction = vi.fn();
    render(<GenerationPanel {...props} onStartProduction={onStartProduction} generation={{ ...base,
      status: 'succeeded', examples: Array.from({ length: 3 }, (_, index) => ({ input: `Seed ${index}` })) }} />);
    const slider = screen.getByRole('slider', { name: 'Количество примеров (до 1000)' });
    expect(slider).toHaveAttribute('min', '3');
    expect(slider).toHaveAttribute('max', '999');
    expect(slider).toHaveAttribute('step', '3');
    expect(slider).toHaveValue('99');
    fireEvent.change(slider, { target: { value: '999' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать задание 2' }));
    expect(slider).toHaveAttribute('step', '2');
    expect(slider).toHaveValue('998');
    fireEvent.click(screen.getByRole('button', { name: 'Масштабировать' }));
    expect(onStartProduction).toHaveBeenCalledWith(998, 'job-1', [0, 2]);
  });
});
