import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

it('keeps an awaiting-moderation submission distinct from a ready benchmark', () => {
  const { rerender } = render(<StatusBadge status="submitted" />);
  expect(screen.getByText('На проверке')).toHaveClass('s-review');
  rerender(<StatusBadge status="ready" />);
  expect(screen.getByText('Готов')).toHaveClass('s-ready');
});
