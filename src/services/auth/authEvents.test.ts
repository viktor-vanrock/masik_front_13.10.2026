import { describe, it, expect, vi } from 'vitest';
import { emitUnauthorized, onUnauthorized } from './authEvents';

describe('authEvents', () => {
  it('вызывает подписчика при emitUnauthorized', () => {
    const handler = vi.fn();
    const unsubscribe = onUnauthorized(handler);

    emitUnauthorized();

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('поддерживает нескольких подписчиков', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = onUnauthorized(h1);
    const u2 = onUnauthorized(h2);

    emitUnauthorized();

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
    u1();
    u2();
  });

  it('после отписки подписчик больше не вызывается', () => {
    const handler = vi.fn();
    const unsubscribe = onUnauthorized(handler);

    emitUnauthorized();
    unsubscribe();
    emitUnauthorized();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('отписка одного слушателя не задевает других', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = onUnauthorized(h1);
    const u2 = onUnauthorized(h2);

    u1();
    emitUnauthorized();

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);
    u2();
  });
});
