export const BenchmarkValidationStatus = {
  Validation: 'validation',
  Published: 'published',
  Rejected: 'rejected',
} as const;

export type BenchmarkValidationStatus =
  (typeof BenchmarkValidationStatus)[keyof typeof BenchmarkValidationStatus];

export const BenchmarkValidationStatusValues = Object.values(
  BenchmarkValidationStatus,
) as BenchmarkValidationStatus[];

export const BenchmarkLinkType = {
  Obs: 'obs',
  Gitverse: 'gitverse',
  Github: 'github',
  Docs: 'docs',
  Dataset: 'dataset',
  ScoreRacoon: 'score_racoon',
  GigaMetrics: 'giga_metrics',
  Other: 'other',
} as const;

export type BenchmarkLinkType =
  (typeof BenchmarkLinkType)[keyof typeof BenchmarkLinkType];

export const BenchmarkSortColumn = {
  CreatedAt: 'createdAt',
  Name: 'name',
  SizeInSamples: 'sizeInSamples',
  Difficulty: 'difficulty',
  Language: 'language',
} as const;

export type BenchmarkSortColumn =
  (typeof BenchmarkSortColumn)[keyof typeof BenchmarkSortColumn];

export const SortDirection = {
  Asc: 'ASC',
  Desc: 'DESC',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
