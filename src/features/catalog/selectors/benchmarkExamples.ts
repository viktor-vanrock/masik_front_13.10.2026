import type { BenchmarkType } from '@/types';
import { pickLocalizedName } from './pickLocalizedName';
import type { AppLang } from './types';

export function selectBenchmarkExamples(
  benchmark: Pick<BenchmarkType, 'examples' | 'datasetSubsamples'>,
  lang: AppLang,
) {
  return [
    ...benchmark.examples.map((example, index) => ({ key: `test-${index}`, example, sourceLabel: null })),
    ...benchmark.datasetSubsamples.flatMap((subsample) => {
      const sourceLabel = `${lang === 'en' ? 'Subset' : 'Подвыборка'}: ${pickLocalizedName(subsample, lang)}${subsample.split ? ` · ${subsample.split}` : ''}`;
      return (subsample.examples ?? []).map((example, index) => ({
        key: `${subsample.id}-${index}`, example, sourceLabel,
      }));
    }),
  ];
}
