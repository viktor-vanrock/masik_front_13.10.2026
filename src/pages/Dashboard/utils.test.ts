import { describe, expect, it } from 'vitest';
import type { BenchmarkType } from '@/types';
import type { DashboardSuite } from './data/types';
import {
  aggregateSuiteModelScore,
  benchmarkModelScore,
} from './utils';

function benchmark(
  id: string,
  scores: BenchmarkType['scores']
): BenchmarkType {
  return { id, scores } as BenchmarkType;
}

describe('Dashboard metric selection', () => {
  const accuracyId = 'accuracy-id';
  const f1Id = 'f1-id';
  const modelId = 'model-id';

  it('returns only the explicitly selected metric for a model', () => {
    const test = benchmark('test-1', [
      {
        modelId,
        modelName: 'Model',
        metricId: accuracyId,
        metricName: 'Accuracy',
        score: 91,
        isOpenSource: false,
        isHumanBaseline: false,
      },
      {
        modelId,
        modelName: 'Model',
        metricId: f1Id,
        metricName: 'F1',
        score: 73,
        isOpenSource: false,
        isHumanBaseline: false,
      },
    ]);

    expect(benchmarkModelScore(test, modelId, accuracyId)).toBe(91);
    expect(benchmarkModelScore(test, modelId, f1Id)).toBe(73);
    expect(benchmarkModelScore(test, modelId, 'unknown')).toBeNull();
  });

  it('aggregates a suite only within one selected metric', () => {
    const suite = {
      id: 'suite',
      testIds: ['test-1', 'test-2'],
      aggregate: 'mean',
    } as DashboardSuite;
    const tests = new Map<string, BenchmarkType>([
      [
        'test-1',
        benchmark('test-1', [
          {
            modelId,
            modelName: 'Model',
            metricId: accuracyId,
            metricName: 'Accuracy',
            score: 80,
            isOpenSource: false,
            isHumanBaseline: false,
          },
          {
            modelId,
            modelName: 'Model',
            metricId: f1Id,
            metricName: 'F1',
            score: 10,
            isOpenSource: false,
            isHumanBaseline: false,
          },
        ]),
      ],
      [
        'test-2',
        benchmark('test-2', [
          {
            modelId,
            modelName: 'Model',
            metricId: accuracyId,
            metricName: 'Accuracy',
            score: 100,
            isOpenSource: false,
            isHumanBaseline: false,
          },
        ]),
      ],
    ]);

    expect(
      aggregateSuiteModelScore(
        suite,
        tests,
        new Set(suite.testIds),
        modelId,
        accuracyId
      )
    ).toBe(90);
    expect(
      aggregateSuiteModelScore(
        suite,
        tests,
        new Set(suite.testIds),
        modelId,
        f1Id
      )
    ).toBe(10);
  });
});
