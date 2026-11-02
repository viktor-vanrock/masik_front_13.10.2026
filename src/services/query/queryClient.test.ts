import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';

describe('createQueryClient', () => {
  it('возвращает инстанс QueryClient', () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });

  it('каждый вызов даёт новый инстанс (важно для тестов и SSR)', () => {
    const a = createQueryClient();
    const b = createQueryClient();
    expect(a).not.toBe(b);
  });

  it('применяет дефолты queries: staleTime, gcTime, retry', () => {
    const qc = createQueryClient();
    const defaults = qc.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBe(30_000);
    expect(defaults?.gcTime).toBe(5 * 60_000);
    expect(defaults?.retry).toBe(1);
  });

  it('применяет дефолты mutations: retry = 0', () => {
    const qc = createQueryClient();
    expect(qc.getDefaultOptions().mutations?.retry).toBe(0);
  });
});
