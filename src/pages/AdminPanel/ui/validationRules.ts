import type { BenchmarkType } from '@/types';

export function hasAssignedMetric(
  benchmark: Pick<BenchmarkType, 'metrics'>,
): boolean {
  return benchmark.metrics.some((metric) => metric.trim().length > 0);
}
