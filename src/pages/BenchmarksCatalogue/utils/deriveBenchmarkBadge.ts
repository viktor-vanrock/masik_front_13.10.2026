import type { BenchmarkType } from '@/types';

export interface BenchmarkBadge {
  label: string;
  tone: 'green' | 'orange' | 'neutral';
}

type BenchmarkBadgeFields = Pick<
  BenchmarkType,
  'validatedByUmr' | 'authorId' | 'validationStatus' | 'source'
>;

/**
 * Derives the optional card badge from catalog metadata.
 * validatedByUmr, authorId and source are not currently returned by the backend;
 * once they are added to its response, this badge logic will use them directly.
 */
export function deriveBenchmarkBadge(
  benchmark: BenchmarkType,
  currentUserId?: string | null,
): BenchmarkBadge | null;
export function deriveBenchmarkBadge(
  benchmark: BenchmarkBadgeFields,
  currentUserId?: string | null,
): BenchmarkBadge | null;
export function deriveBenchmarkBadge(
  benchmark: BenchmarkBadgeFields,
  currentUserId?: string | null,
): BenchmarkBadge | null {
  if (benchmark.validatedByUmr === true) {
    return { label: 'Проверен УМР', tone: 'green' };
  }

  if (
    currentUserId &&
    benchmark.authorId &&
    benchmark.authorId === currentUserId &&
    benchmark.validationStatus !== 'published'
  ) {
    return { label: 'Черновик', tone: 'orange' };
  }

  if (typeof benchmark.source === 'string' && benchmark.source.trim()) {
    return { label: benchmark.source.trim(), tone: 'neutral' };
  }

  return { label: 'NexTest', tone: 'neutral' };
}
