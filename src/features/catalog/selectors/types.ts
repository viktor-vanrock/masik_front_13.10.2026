import type {
  BenchmarkCodebase,
  BenchmarkExample,
  BenchmarkLengthDistribution,
  BenchmarkLinkItem,
  BenchmarkReference,
  BenchmarkScore,
} from '@/types';
import type { BenchmarkValidationStatus } from '@/types/catalog.enums';

/**
 * Locally defined to keep selectors independent of hooks/i18n modules.
 * Mirrors `Lang` from `@/i18n` — keep in sync if values ever change.
 */
export type AppLang = 'ru' | 'en';

export interface TaxonomyLabel {
  id: string;
  label: string;
}

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface CascadeFilterSelectOption extends FilterSelectOption {
  /** Id of the parent dictionary entry (macro-group / domain). */
  parentId: string;
}

export interface FilterOptionsVM {
  macroGroups: FilterSelectOption[];
  subGroups: CascadeFilterSelectOption[];
  abilityTaxons: FilterSelectOption[];
  taskTypes: FilterSelectOption[];
  modalities: FilterSelectOption[];
  languages: FilterSelectOption[];
  difficulties: FilterSelectOption[];
  capabilities: FilterSelectOption[];
  domains: FilterSelectOption[];
  subdomains: CascadeFilterSelectOption[];
  skills: FilterSelectOption[];
  abilityTags: FilterSelectOption[];
}

export interface DatasetSubsampleVM {
  id: string;
  name: string;
  nameEn: string;
  displayName: string;
  description?: string;
  split?: string;
  sizeInSamples: number;
  medianSampleSizeWords: number;
  requestLengthDist: BenchmarkLengthDistribution;
  responseLengthDist: BenchmarkLengthDistribution;
  examples?: BenchmarkExample[];
}

/**
 * Full render-ready model for a BenchmarkTest.
 * Taxonomy refs collapsed to `{ id, label }`; primitive sub-shapes passed
 * through. Components should consume this and never reach back to raw DTOs.
 */
export interface BenchmarkTestVM {
  id: string;
  suiteId: string;

  // raw names kept for non-display uses (search, equality checks)
  name: string;
  nameEn: string;

  displayName: string;
  displayDescription: string;
  shortDescription?: string;
  taskDescription?: string;
  instructions: string;

  macroGroup: TaxonomyLabel | null;
  taskType: TaxonomyLabel | null;
  language: TaxonomyLabel | null;
  difficulty: TaxonomyLabel | null;

  subGroups: TaxonomyLabel[];
  abilityTaxons: TaxonomyLabel[];
  modalities: TaxonomyLabel[];
  capabilities: TaxonomyLabel[];
  domains: TaxonomyLabel[];
  subdomains: TaxonomyLabel[];

  skills: string[];
  abilityTags: string[];

  metrics: string[];
  examples: BenchmarkExample[];
  references: BenchmarkReference[];
  links: BenchmarkLinkItem[];
  codebase: BenchmarkCodebase;
  scores: BenchmarkScore[];
  datasetSubsamples: DatasetSubsampleVM[];

  sizeInSamples: number;
  medianSampleSizeWords: number;
  requestLengthDist: BenchmarkLengthDistribution;
  responseLengthDist: BenchmarkLengthDistribution;

  confidenceScore?: number;
  confidentialityLevel?: string;
  knowledgeLevel?: string;
  importance?: string;
  importanceComment?: string;

  contextFieldFormat?: string;
  answerFieldFormat?: string;
  evaluationLogic?: string;

  humanBaseline?: number;
  humanBaselineNotes?: string;

  recommendedMetricsDescription?: string;
  requiredGigaChatQualityLevel?: string;

  gigaMetricAdapterName?: string;
  gigaMetricSetUrl?: string;
  gigaMetricLaunchCommand?: string;
  gigaMetricsCodebaseUrl?: string;

  validationStatus?: BenchmarkValidationStatus;
  isGenerated: boolean;
  jiraTicketId?: string;
  generatedAt?: string;
}
