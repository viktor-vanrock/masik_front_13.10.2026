import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactRequestsSection, type ContactRequestItem } from './ContactRequestsSection';

vi.mock('@/hooks/useApp', () => ({ useApp: () => ({ lang: 'ru' }) }));
const item: ContactRequestItem = {
  publicNumber: 'AIJ-2026-ABC', chatId: 'chat-1', chatTitle: 'Налоги', chatAvailable: false,
  fullName: 'Иван Иванов', email: 'ivan@example.test', consent: true,
  consentAt: '2026-10-30T10:00:00Z', consentVersion: 'v1', createdAt: '2026-10-30T10:00:00Z',
  requirements: { goal: 'Проверить знания', task_count: '5' },
};
const props = { items: [item], isPending: false, isError: false, isFetchingNextPage: false,
  hasNextPage: false, onLoadMore: vi.fn(), onRetry: vi.fn() };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('contact requests', () => {
  it('shows contact, consent, chat and expandable requirements without linking to a foreign chat', () => {
    render(<MemoryRouter><ContactRequestsSection {...props} /></MemoryRouter>);
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('ivan@example.test')).toBeInTheDocument();
    expect(screen.getByText('Налоги · chat-1')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('Чат доступен его владельцу')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Требования к бенчмарку'));
    expect(screen.getByText('Проверить знания')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Открыть чат' })).not.toBeInTheDocument();
  });

  it('loads another page when the sentinel enters view and offers a manual fallback', () => {
    let notify!: IntersectionObserverCallback;
    const observe = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { notify = callback; }
      observe = observe;
      disconnect = vi.fn();
    });
    const load = vi.fn();
    render(<MemoryRouter><ContactRequestsSection {...props} hasNextPage onLoadMore={load} /></MemoryRouter>);
    expect(observe).toHaveBeenCalled();
    notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(load).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Загрузить ещё' }));
    expect(load).toHaveBeenCalledTimes(2);
  });
});
