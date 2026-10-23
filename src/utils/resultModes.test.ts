import { describe, expect, it } from 'vitest';
import type { BenchmarkScore, BenchmarkType, MetricResult } from '@/types';
import { aggregateSuiteModelScore, benchmarkModelScore } from '@/pages/Dashboard/utils';
import { benchmarksForMode, boardSourceMode, latestResults, metricResultsForMode, summarizeModelMode } from './resultModes';

const score = (sourceMode: BenchmarkScore['sourceMode'], value: number, obtainedAt: string): BenchmarkScore => ({
  modelId: 'model', modelName: 'Model', metricId: 'accuracy', score: value,
  auqtc: value / 100, tokensPerSec: value, sourceMode, obtainedAt,
  architecture: 'text-diffusion', isOpenSource: false, isHumanBaseline: false,
});
const scores = [
  score('benchmark', 90, '2026-10-23T00:00:00Z'),
  score('harness', 30, '2026-10-22T00:00:00Z'),
  score('harness', 10, '2026-10-21T00:00:00Z'),
];
const test = { id: 'test', scores } as BenchmarkType;

describe('Result source mode consumers', () => {
  it('retains the newest result independently for every model, metric and mode', () => {
    expect(latestResults(scores).map((entry) => entry.score)).toEqual([90, 30]);
  });

  it.each([
    ['general', 'benchmark', 90], ['agent-systems', 'harness', 30],
    ['alternative-architectures', 'benchmark', 90],
  ] as const)('keeps %s scores separate', (board, expectedMode, expectedValue) => {
    const mode = boardSourceMode(board);
    expect(mode).toBe(expectedMode);
    const [filtered] = benchmarksForMode([test], mode);
    expect(filtered.scores).toHaveLength(1);
    expect(benchmarkModelScore(filtered, 'model', 'accuracy', mode)).toBe(expectedValue);
    expect(aggregateSuiteModelScore(
      { id: 'suite', name: 'Suite', nameEn: 'Suite', testIds: ['test'], aggregate: 'mean' },
      new Map([['test', test]]), new Set(['test']), 'model', 'accuracy', mode,
    )).toBe(expectedValue);
    expect(summarizeModelMode([test], 'model', mode)).toMatchObject({ score: expectedValue, speed: expectedValue });
  });

  it('lets architecture and custom boards select a mode without overriding fixed system modes', () => {
    expect(boardSourceMode('alternative-architectures', 'harness')).toBe('harness');
    expect(boardSourceMode(null, 'stress')).toBe('stress');
    expect(boardSourceMode('general', 'harness')).toBe('benchmark');
    expect(boardSourceMode('agent-systems', 'benchmark')).toBe('harness');
  });

  it('has no scores for a model without results in the selected mode', () => {
    const benchmarkOnly = { ...test, scores: [scores[0]] };
    expect(summarizeModelMode([benchmarkOnly], 'model', 'harness').score).toBeNull();
    expect(benchmarksForMode([benchmarkOnly], 'harness')[0].scores).toEqual([]);
  });

  it('calculates RunResult quality, efficiency and speed separately for each mode', () => {
    expect(summarizeModelMode([test], 'model', 'benchmark')).toMatchObject({ score: 90, auqtc: 0.9, speed: 90 });
    expect(summarizeModelMode([test], 'model', 'harness')).toMatchObject({ score: 30, auqtc: 0.3, speed: 30 });
  });

  it('keeps ScoresTab history separate by mode', () => {
    const results = scores.map((entry, i) => ({
      id: String(i), modelId: entry.modelId, metricId: entry.metricId,
      sourceMode: entry.sourceMode, obtainedAt: entry.obtainedAt, value: entry.score,
    })) as MetricResult[];
    expect(metricResultsForMode(results, 'benchmark').map((entry) => entry.value)).toEqual([90]);
    expect(metricResultsForMode(results, 'harness').map((entry) => entry.value)).toEqual([30]);
  });
});
