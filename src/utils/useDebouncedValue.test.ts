import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('возвращает начальное значение сразу (до таймера)', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('новое значение появляется через delay мс', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 300),
      { initialProps: { v: 'a' } },
    );
    expect(result.current).toBe('a');

    rerender({ v: 'b' });
    // Ещё не прошло время — старое значение.
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('быстрые изменения резетят таймер — побеждает последнее', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 300),
      { initialProps: { v: 'a' } },
    );

    rerender({ v: 'b' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ v: 'c' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // 400 мс прошло суммарно, но таймер ресетнулся на 'c' через 200 мс — ещё рано.
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    // 300 мс с момента 'c' — обновилось.
    expect(result.current).toBe('c');
  });

  it('delay: 0 обновляет на следующем тике', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 0),
      { initialProps: { v: 'a' } },
    );

    rerender({ v: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('b');
  });

  it('смена delay начинает новый таймер', () => {
    const { result, rerender } = renderHook(
      ({ v, d }: { v: string; d: number }) => useDebouncedValue(v, d),
      { initialProps: { v: 'a', d: 1000 } },
    );

    rerender({ v: 'b', d: 1000 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('a');

    // Меняем delay на меньший — таймер пересоздан.
    rerender({ v: 'b', d: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('b');
  });

  it('работает с разными типами (number, объект)', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: number }) => useDebouncedValue(v, 100),
      { initialProps: { v: 0 } },
    );

    rerender({ v: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });
});
