import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatSpecification } from './ChatSpecification';

describe('ChatSpecification compact values', () => {
  const observers: { element?: Element; callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn<() => void>> }[] = [];

  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('ResizeObserver', class {
      record: typeof observers[number];
      constructor(callback: ResizeObserverCallback) {
        this.record = { callback, disconnect: vi.fn() };
        observers.push(this.record);
      }
      observe(element: Element) { this.record.element = element; }
      disconnect() { this.record.disconnect(); }
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  function resize(element: HTMLElement, scrollHeight: number, clientHeight: number) {
    Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight });
    const observer = observers.findLast((record) => record.element === element)!;
    act(() => observer.callback([], {} as ResizeObserver));
  }

  it('keeps short rows disabled and preserves counts and empty values', () => {
    render(<ChatSpecification mode="create" specification={{ domain: 'Медицина' }} />);
    const value = screen.getByText('Медицина');
    resize(value, 20, 20);
    expect(value.closest('button')).toBeDisabled();
    expect(value.closest('button')).not.toHaveAttribute('aria-expanded');
    expect(screen.getByText('2/7')).toBeInTheDocument();
    expect(screen.getAllByText('не задано')).toHaveLength(5);
    expect(screen.queryByText('Показать полностью')).not.toBeInTheDocument();
  });

  it('discloses an overflowing value without changing its complete text or specification count', () => {
    const goal = 'Проверяем точность ответов с учётом всех требований. '.repeat(20);
    render(<ChatSpecification mode="create" specification={{ goal }} />);
    const value = screen.getByText(goal.trim());
    resize(value, 400, 60);
    const row = value.closest('button')!;
    expect(row).toBeEnabled();
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Показать полностью')).toBeVisible();
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(value).toHaveAttribute('data-expanded', 'true');
    expect(value.textContent).toBe(goal);
    expect(screen.getByText('Свернуть')).toBeVisible();
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(value).not.toHaveAttribute('data-expanded');
    expect(screen.getByText('2/7')).toBeInTheDocument();
  });

  it('resets disclosure after the canonical value changes and releases old observers', () => {
    const { rerender, unmount } = render(<ChatSpecification specification={{ goal: 'Старая цель' }} />);
    const oldValue = screen.getByText('Старая цель');
    resize(oldValue, 400, 60);
    fireEvent.click(oldValue.closest('button')!);
    const oldObserver = observers.findLast((record) => record.element === oldValue)!;
    rerender(<ChatSpecification specification={{ goal: 'Исправленная цель' }} />);
    expect(oldObserver.disconnect).toHaveBeenCalledOnce();
    const newValue = screen.getByText('Исправленная цель');
    resize(newValue, 300, 60);
    expect(newValue.closest('button')).toHaveAttribute('aria-expanded', 'false');
    expect(newValue).not.toHaveAttribute('data-expanded');
    unmount();
    expect(observers.every((observer) => observer.disconnect.mock.calls.length === 1)).toBe(true);
  });

  it('detects overflow after the hidden sidebar becomes visible and updates after width changes', () => {
    render(<ChatSpecification mode="modify" sourceName="Исходный бенчмарк" specification={{ goal: 'Цель' }} />);
    const value = screen.getByText('Цель');
    resize(value, 0, 0);
    expect(value.closest('button')).toBeDisabled();
    resize(value, 200, 60);
    expect(value.closest('button')).toBeEnabled();
    resize(value, 40, 40);
    expect(value.closest('button')).toBeDisabled();
    expect(screen.getByText('3/8')).toBeInTheDocument();
    expect(screen.getByText('Исходный бенчмарк')).toBeInTheDocument();
  });

  it('starts collapsed in another owner/chat scope even when the value is identical', () => {
    const specification = { goal: 'Одинаковая цель в двух чатах' };
    const { rerender } = render(<ChatSpecification key="owner-a:chat-a" specification={specification} />);
    const value = screen.getByText(specification.goal);
    resize(value, 400, 60);
    fireEvent.click(value.closest('button')!);
    expect(value.closest('button')).toHaveAttribute('aria-expanded', 'true');
    rerender(<ChatSpecification key="owner-b:chat-b" specification={specification} />);
    const nextValue = screen.getByText(specification.goal);
    resize(nextValue, 400, 60);
    expect(nextValue.closest('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps complete values unclamped when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const goal = 'Полное требование без потери текста. '.repeat(30);
    render(<ChatSpecification specification={{ goal }} />);
    const value = screen.getByText(goal.trim());
    expect(value.textContent).toBe(goal);
    expect(value).not.toHaveClass('spec-value');
    expect(value.closest('button')).toBeDisabled();
    expect(screen.queryByText('Показать полностью')).not.toBeInTheDocument();
  });
});
