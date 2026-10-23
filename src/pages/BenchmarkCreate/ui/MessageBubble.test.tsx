import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { translations } from '@/i18n';
import { MessageBubble } from './MessageBubble';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({ t: translations.ru, lang: 'ru' }),
}));

describe('MessageBubble recommendations', () => {
  it('uses the clicked benchmark recommendation ID', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(<MemoryRouter><MessageBubble
      msg={{
        id: 'message-1', role: 'assistant', content: 'Результаты',
        timestamp: '2026-09-23T00:00:00.000Z',
        recommendations: ['benchmark-a', 'benchmark-b'],
        recommendationItems: [
          { testId: 'benchmark-a', id: 'recommendation-a', status: 'pending' },
          { testId: 'benchmark-b', id: 'recommendation-b', status: 'pending' },
        ],
      }}
      benchmarks={[]}
      onAcceptRecommendation={onAccept}
      onRejectRecommendation={onReject}
    /></MemoryRouter>);

    fireEvent.click(screen.getAllByRole('button', { name: translations.ru.create.recommendYes })[1]);
    expect(onAccept).toHaveBeenCalledWith('recommendation-b');
    fireEvent.click(screen.getAllByRole('button', { name: translations.ru.create.recommendNo })[0]);
    expect(onReject).toHaveBeenCalledWith('recommendation-a');
  });
});
