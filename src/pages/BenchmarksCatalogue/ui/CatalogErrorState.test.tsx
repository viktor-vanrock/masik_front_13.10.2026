import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CatalogErrorState } from './CatalogErrorState';
import { ApiException } from '@/services/http';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({
    t: {
      catalogue: {
        loadErrorTitle: 'Не удалось загрузить каталог',
        loadErrorFallback: 'Что-то пошло не так.',
        retry: 'Повторить',
      },
    },
  }),
}));

describe('CatalogErrorState', () => {
  it('показывает fallback-сообщение если formatServerErrorMessage вернул null', () => {
    const { getByText } = render(
      <CatalogErrorState error={null} onRetry={() => {}} />,
    );
    expect(getByText('Не удалось загрузить каталог')).toBeInTheDocument();
    expect(getByText('Что-то пошло не так.')).toBeInTheDocument();
  });

  it('показывает сообщение из ApiException.payload', () => {
    const err = new ApiException({
      statusCode: 500,
      message: 'Internal Server Error',
    });
    const { getByText } = render(
      <CatalogErrorState error={err} onRetry={() => {}} />,
    );
    expect(getByText('Internal Server Error')).toBeInTheDocument();
  });

  it('клик по кнопке зовёт onRetry', () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <CatalogErrorState error={null} onRetry={onRetry} />,
    );
    fireEvent.click(getByText('Повторить'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('имеет role="alert" для a11y', () => {
    const { getByRole } = render(
      <CatalogErrorState error={null} onRetry={() => {}} />,
    );
    expect(getByRole('alert')).toBeInTheDocument();
  });
});
