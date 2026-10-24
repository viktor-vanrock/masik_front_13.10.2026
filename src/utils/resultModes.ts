import type { BenchmarkScore, BenchmarkType, MetricResult, SourceMode } from '@/types';

export const SOURCE_MODES: SourceMode[] = ['benchmark', 'stress', 'production', 'comparison', 'harness'];

// Older catalog fixtures omitted sourceMode; the storage default is benchmark.
export const resultMode = (result: { sourceMode?: SourceMode }): SourceMode => result.sourceMode ?? 'benchmark';

const resultTimestamp = (obtainedAt?: string): number => {
  if (!obtainedAt) return Number.NEGATIVE_INFINITY;
  const timestamp = Date.parse(obtainedAt);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export function latestResults<T extends {
  modelId: string; metricId?: string; sourceMode?: SourceMode; obtainedAt?: string;
}>(results: T[]): T[] {
  const latest = new Map<string, T>();
  for (const result of results) {
    const key = JSON.stringify([result.modelId, result.metricId, resultMode(result)]);
    const current = latest.get(key);
    if (!current || resultTimestamp(result.obtainedAt) > resultTimestamp(current.obtainedAt)) latest.set(key, result);
  }
  return [...latest.values()];
}

export function benchmarksForMode(benchmarks: BenchmarkType[], mode: SourceMode): BenchmarkType[] {
  return benchmarks.map((test) => ({
    ...test, scores: latestResults(test.scores).filter((score) => resultMode(score) === mode),
  }));
}

export function boardSourceMode(systemKey?: string | null, selected: SourceMode = 'benchmark'): SourceMode {
  if (systemKey === 'general') return 'benchmark';
  // Agent system boards use harness results by design.
  if (systemKey === 'agent-systems') return 'harness';
  return selected;
}

export function scoresForModel(benchmarks: BenchmarkType[], modelId: string, mode: SourceMode): BenchmarkScore[] {
  return benchmarksForMode(benchmarks, mode).flatMap((test) => test.scores)
    .filter((score) => score.modelId === modelId && !score.isHumanBaseline);
}

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export function summarizeModelMode(benchmarks: BenchmarkType[], modelId: string, mode: SourceMode) {
  const scores = scoresForModel(benchmarks, modelId, mode);
  return {
    modelName: scores[0]?.modelName,
    score: average(scores.map((score) => score.score)),
    auqtc: average(scores.map((score) => score.auqtc).filter((value): value is number => value != null)),
    speed: average(scores.map((score) => score.tokensPerSec).filter((value): value is number => value != null)),
    updatedAt: scores.map((score) => score.obtainedAt).filter((value): value is string => Boolean(value)).sort().at(-1),
  };
}

export function metricResultsForMode(results: MetricResult[], mode: SourceMode): MetricResult[] {
  return latestResults(results).filter((result) => resultMode(result) === mode);
}
