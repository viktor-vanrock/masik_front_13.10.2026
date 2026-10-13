import type { AnyTranslations } from '@/i18n';

export const STEP_KEYS = ['basic', 'taxonomy', 'parameters', 'domains', 'examples'] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export const STEPS = STEP_KEYS;

export const getStepTitle = (
  t: AnyTranslations['newBenchmark'],
  index: number,
): string => {
  const key = STEP_KEYS[index];
  return key ? t.steps[key] : '';
};