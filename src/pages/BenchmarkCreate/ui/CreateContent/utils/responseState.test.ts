import { describe, expect, it } from 'vitest';
import type { ChatResponseState } from '@/types';
import { latestResponseState } from './responseState';

const pending: ChatResponseState = {
  requestId: 'request-1', userMessageId: 'request-1', status: 'pending', attempt: 1,
  error: null, updatedAt: '2026-10-29T10:00:00Z',
};

describe('latestResponseState', () => {
  it('preserves socket state when an old REST response has no state', () => {
    expect(latestResponseState(pending, null)).toBe(pending);
    expect(latestResponseState(pending, undefined)).toBe(pending);
  });

  it('does not compare attempt counts across different requests', () => {
    const previous = { ...pending, attempt: 3, status: 'failed' as const };
    const next = { ...pending, requestId: 'request-2', userMessageId: 'request-2', updatedAt: '2026-10-29T10:00:01Z' };
    expect(latestResponseState(previous, next)).toBe(next);
    expect(latestResponseState(next, previous)).toBe(next);
    expect(latestResponseState(next, { ...previous, updatedAt: next.updatedAt })).toBe(next);
  });

  it('accepts a server acknowledgement despite browser clock skew without reopening a settled attempt', () => {
    const optimistic = { ...pending, updatedAt: '2026-10-29T11:00:00Z' };
    const answered = { ...pending, status: 'responded' as const };
    expect(latestResponseState(optimistic, answered)).toBe(answered);
    expect(latestResponseState(answered, optimistic)).toBe(answered);
  });

  it('accepts newer durable progress at the same response timestamp without reverting to a delayed stage', () => {
    const compose = { ...pending, progress: { stage: 'compose' as const, message: 'Готовим бриф', updatedAt: '2026-11-02T10:00:00Z' } };
    const validate = { ...pending, progress: { stage: 'validate' as const, message: 'Проверяем бриф', updatedAt: '2026-11-02T10:00:01Z' } };
    expect(latestResponseState(compose, validate)).toBe(validate);
    expect(latestResponseState(validate, compose)).toBe(validate);
    expect(latestResponseState(validate, pending)).toBe(validate);
    expect(latestResponseState(validate, { ...pending, attempt: 2 })).toEqual({ ...pending, attempt: 2 });
  });
});
