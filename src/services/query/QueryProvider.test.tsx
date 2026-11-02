import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { QueryProvider } from './QueryProvider';
import { getQueryClient, resetQueryClient } from './queryClientRef';

describe('QueryProvider', () => {
  beforeEach(() => {
    resetQueryClient();
  });

  it('регистрирует QueryClient в queryClientRef', () => {
    expect(getQueryClient()).toBeNull();
    render(
      <QueryProvider>
        <div>child</div>
      </QueryProvider>
    );
    expect(getQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('использует переданный извне client (для тестов/Storybook)', () => {
    const custom = new QueryClient();
    render(
      <QueryProvider client={custom}>
        <div>child</div>
      </QueryProvider>
    );
    expect(getQueryClient()).toBe(custom);
  });

  it('рендерит children', () => {
    const { getByText } = render(
      <QueryProvider>
        <span>hello</span>
      </QueryProvider>
    );
    expect(getByText('hello')).toBeInTheDocument();
  });
});
