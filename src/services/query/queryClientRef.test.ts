import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  setQueryClient,
  getQueryClient,
  resetQueryClient,
} from './queryClientRef';

describe('queryClientRef', () => {
  beforeEach(() => {
    resetQueryClient();
  });

  it('до setQueryClient геттер возвращает null', () => {
    expect(getQueryClient()).toBeNull();
  });

  it('после setQueryClient возвращает тот же инстанс', () => {
    const qc = new QueryClient();
    setQueryClient(qc);
    expect(getQueryClient()).toBe(qc);
  });

  it('повторный set перезаписывает инстанс', () => {
    const qc1 = new QueryClient();
    const qc2 = new QueryClient();
    setQueryClient(qc1);
    setQueryClient(qc2);
    expect(getQueryClient()).toBe(qc2);
  });

  it('resetQueryClient очищает ссылку', () => {
    setQueryClient(new QueryClient());
    resetQueryClient();
    expect(getQueryClient()).toBeNull();
  });
});
