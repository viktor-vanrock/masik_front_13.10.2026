import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/hooks/useApp', () => ({
  useApp: () => ({
    t: { common: { aria: { loadingCatalogue: 'Loading' } } },
  }),
}));

import { BenchmarksGridSkeleton } from './BenchmarksGridSkeleton';

describe('BenchmarksGridSkeleton', () => {
  it('рендерит 6 плейсхолдеров', () => {
    const { container } = render(<BenchmarksGridSkeleton />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(6);
  });

  it('имеет role="status" для a11y', () => {
    const { getByRole } = render(<BenchmarksGridSkeleton />);
    expect(getByRole('status')).toBeInTheDocument();
  });
});
