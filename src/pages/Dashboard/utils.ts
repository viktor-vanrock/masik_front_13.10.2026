import type { BenchmarkType } from '@/types';
import { resultMode } from '@/utils/resultModes';
import type { SourceMode } from '@/types';
import type { DashboardSuite } from '@/pages/Dashboard/data/types';

/**
 * Создает карту бенчмарков по их ID для быстрого доступа
 */
export function benchmarkMap(benchmarks: BenchmarkType[]): Map<string, BenchmarkType> {
  const map = new Map();
  benchmarks.forEach(b => map.set(b.id, b));
  return map;
}

/**
 * Возвращает количество выбранных бенчмарков в наборе
 */
export function suiteSelectedCount(
  suite: DashboardSuite, 
  selectedBenchmarks: Set<string>
): number {
  return suite.testIds.filter(id => selectedBenchmarks.has(id)).length;
}

/**
 * Проверяет, выбраны ли все бенчмарки в наборе
 */
export function allSuiteMembersSelected(
  suite: DashboardSuite, 
  selectedBenchmarks: Set<string>
): boolean {
  return suite.testIds.every(id => selectedBenchmarks.has(id));
}

/**
 * Returns a score only for the explicitly selected Metric. Tests can expose
 * several independent results, so choosing the first result is not valid.
 */
export function benchmarkModelScore(
  benchmark: BenchmarkType,
  modelId: string,
  metricId: string | null,
  sourceMode: SourceMode = 'benchmark'
): number | null {
  if (!metricId) return null;

  const scoreEntry = benchmark.scores.find(
    (score) =>
      score.modelId === modelId &&
      score.metricId === metricId &&
      resultMode(score) === sourceMode &&
      !score.isHumanBaseline
  );

  return scoreEntry?.score ?? null;
}

/**
 * Вычисляет средний балл модели по набору бенчмаркам
 */
export function aggregateSuiteModelScore(
  suite: DashboardSuite,
  bmMap: Map<string, BenchmarkType>,
  selectedBenchmarks: Set<string>,
  modelId: string,
  metricId: string | null,
  sourceMode: SourceMode = 'benchmark'
): number | null {
  const selectedSuiteBms = suite.testIds.filter(id =>
    selectedBenchmarks.has(id)
  );
  
  if (selectedSuiteBms.length === 0) return null;
  
  const scores: number[] = [];
  
  for (const bmId of selectedSuiteBms) {
    const benchmark = bmMap.get(bmId);
    if (!benchmark) continue;
    
    const score = benchmarkModelScore(benchmark, modelId, metricId, sourceMode);

    if (score != null) {
      scores.push(score);
    }
  }
  
  if (scores.length === 0) return null;
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
