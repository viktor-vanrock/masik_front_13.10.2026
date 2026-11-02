import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { ResponseProgress } from './ResponseProgress';
import type { ChatResponseProgress } from '@/types';

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ t: translations.ru }) }));

describe('response progress', () => {
  it('announces a generic pending request with no fabricated progress percentage', () => {
    render(<ResponseProgress connected message={null} />);
    expect(screen.getByRole('status')).toHaveTextContent('Ожидаем ответ');
    expect(screen.getByRole('status')).not.toHaveTextContent('%');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('shows the actual reported stage', () => {
    render(<ResponseProgress connected message="Ищем подходящие бенчмарки" />);
    expect(screen.getByRole('status')).toHaveTextContent('Ищем подходящие бенчмарки');
  });

  it('does not claim the model is working while the connection is unavailable', () => {
    render(<ResponseProgress connected={false} message="Ищем подходящие бенчмарки" />);
    expect(screen.getByRole('status')).toHaveTextContent('Ожидаем соединение');
    expect(screen.getByRole('status')).toHaveTextContent('Запрос сохранён');
    expect(screen.queryByText('Ищем подходящие бенчмарки')).not.toBeInTheDocument();
  });

  it.each(['compose', 'validate', 'retry', 'save'] as const)('shows the confirmed %s brief stage without invented completion', (stage) => {
    const progress: ChatResponseProgress = { stage, message: `Сервер: ${stage}`, updatedAt: '2026-11-02T10:00:00Z' };
    const { container } = render(<ResponseProgress connected message="Устаревший текст" progress={progress} />);
    const rows = [...container.querySelectorAll('.steps li')];
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveClass('ok');
    expect(rows[1]).toHaveClass(stage === 'save' ? 'ok' : 'on');
    expect(rows[2]).not.toHaveClass('ok');
    if (stage === 'save') expect(rows[2]).toHaveClass('on');
    expect(screen.getByText('Сервер: ' + stage)).toBeVisible();
    expect(screen.queryByText('Устаревший текст')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent('%');
    expect(screen.getByRole('status')).toHaveTextContent(translations.ru.create.briefProgress[stage]);
    expect(container.querySelector('[aria-current="step"]')).toBe(rows[stage === 'save' ? 2 : 1]);
  });

  it('keeps the last confirmed brief stage while reconnecting without claiming live activity', () => {
    const { container } = render(<ResponseProgress connected={false} message={null} progress={{
      stage: 'validate', message: 'Проверяем бриф', updatedAt: '2026-11-02T10:00:00Z',
    }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Последний подтверждённый этап: Проверяем бриф');
    expect(screen.getByRole('status')).toHaveTextContent('Ожидаем соединение');
    expect(container.querySelector('.steps .on')).toBeNull();
    expect(container.querySelector('[aria-current]')).toBeNull();
    expect(screen.queryByLabelText('BenchFactory печатает')).not.toBeInTheDocument();
  });
});
