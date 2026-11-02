import { describe, expect, it } from 'vitest';
import { hasAssignedMetric } from './validationRules';

describe('validation publication rules', () => {
  it('blocks publication when no Metric is assigned', () => {
    expect(hasAssignedMetric({ metrics: [] })).toBe(false);
    expect(hasAssignedMetric({ metrics: ['  '] })).toBe(false);
  });

  it('allows publication when at least one Metric is assigned', () => {
    expect(hasAssignedMetric({ metrics: ['Accuracy'] })).toBe(true);
  });
});
