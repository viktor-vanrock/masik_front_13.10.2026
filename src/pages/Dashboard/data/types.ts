/**
 * Dashboard mock-data shape. Self-contained — does NOT import from `@/types`.
 *
 * Required fields are those actually read by Dashboard UI/hooks or by
 * BenchmarkCreate (which consumes the same mock store via `BenchmarksContext`
 * until that flow migrates to the real API).
 *
 * Optional fields exist because they are present in existing mock literals
 * (`benchmarks.ts`). They are Dashboard-internal mock authoring, not BE
 * contract surface — full cleanup is a separate hygiene task.
 */

export interface MockModelScore {
  modelId: string;
  modelName: string;
  metricId?: string;
  metricName?: string;
  score: number;
  isOpenSource: boolean;
  isHumanBaseline?: boolean;
  obtainedAt?: string;
}

export interface MockBenchmarkExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface MockBenchmarkReference {
  title: string;
  url: string;
}

export interface MockBenchmarkCodebase {
  name?: string;
  url: string;
}

export interface MockLengthDistribution {
  min: number;
  median: number;
  max: number;
}

export interface MockDatasetSubsample {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  split?: string;
  sizeInSamples: number;
  medianSampleSizeWords?: number;
  requestLengthDist?: MockLengthDistribution;
  responseLengthDist?: MockLengthDistribution;
  examples?: MockBenchmarkExample[];
}

export interface MockBenchmark {
  // identity / display (used)
  id: string;
  suiteId?: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;

  // Dashboard-internal taxonomy as plain strings (used in radar grouping
  // and BenchmarkCreate search/recommendations).
  macroGroup: string;
  subGroups: string[];
  abilityTaxons: string[];
  domains: string[];
  subdomains: string[];
  taskType: string;

  // sizing / external link surfaced by Dashboard
  sizeInSamples: number;
  gigaMetricSetUrl?: string;

  scores: MockModelScore[];

  // Authoring fields present in mock literals but not consumed by current
  // code. Kept optional so legacy literals compile without manual stripping.
  codebase?: MockBenchmarkCodebase;
  metrics?: string[];
  examples?: MockBenchmarkExample[];
  instructions?: string;
  instructionsEn?: string;
  references?: MockBenchmarkReference[];
  links?: Array<{ type: string; title: string; url: string }>;
  modality?: string;
  modalities?: string[];
  medianSampleSizeWords?: number;
  requestLengthDist?: MockLengthDistribution;
  responseLengthDist?: MockLengthDistribution;
  language?: string;
  difficulty?: string;
  fewShot?: boolean;
  rag?: boolean;
  tools?: boolean;
  reasoning?: boolean;
  longContext?: boolean;
  abilityTags?: string[];
  skills?: string[];
  datasetSubsamples?: MockDatasetSubsample[];
  validationStatus?: string;
  isGenerated?: boolean;
  jiraTicketId?: string;
  generatedAt?: string;
}

export type MockLanguage = 'ru' | 'en' | 'multilingual';

export type MockDifficulty = 'primary' | 'secondary' | 'higher' | 'expert';

export type DashboardSuiteAggregate = 'mean' | 'weightedBySamples';

export interface DashboardSuite {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  testIds: string[];
  aggregate: DashboardSuiteAggregate;
  gigaMetricLaunchCommand?: string;
  gigaMetricSetUrl?: string;
}
