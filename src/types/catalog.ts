import type { DictionaryRef } from './dictionary';
import type {
  BenchmarkLinkType,
  BenchmarkSortColumn,
  SortDirection,
  BenchmarkValidationStatus,
} from './catalog.enums';
export interface BenchmarkScore {
  modelId: string;
  modelName: string;
  metricId?: string;
  metricName?: string;
  score: number;
  isOpenSource: boolean;
  isHumanBaseline: boolean;
  obtainedAt?: string;
}

export interface BenchmarkExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface BenchmarkReference {
  title: string;
  url: string;
}

export interface BenchmarkLinkItem {
  type: BenchmarkLinkType;
  title: string;
  url: string;
}

export interface BenchmarkLengthDistribution {
  min: number;
  median: number;
  max: number;
}

export interface BenchmarkCodebase {
  name: string;
  url: string;
}

export interface CatalogEntry {
  id: string;
  status: BenchmarkValidationStatus;
  authorId: string | null;
  sourceConversationId: string | null;
  rejectionReason: string | null;
  reviewedById: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface DatasetSubsample {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  split?: string;
  sizeInSamples: number;
  medianSampleSizeWords: number;
  requestLengthDist: BenchmarkLengthDistribution;
  responseLengthDist: BenchmarkLengthDistribution;
  examples?: BenchmarkExample[];
}

export interface BenchmarkType {
  id: string;
  /** UUID of the parent Benchmark (suite). */
  suiteId: string;

  name: string;
  nameEn: string;

  description: string;
  descriptionEn: string;

  shortDescription?: string;
  taskDescription?: string;

  codebase: BenchmarkCodebase;

  metrics: string[];
  examples: BenchmarkExample[];

  instructions: string;
  instructionsEn: string;

  references: BenchmarkReference[];
  links: BenchmarkLinkItem[];

  // FK-backed taxonomy (single)
  macroGroup: DictionaryRef | null;
  taskType: DictionaryRef | null;
  language: DictionaryRef | null;
  difficulty: DictionaryRef | null;

  // FK-backed taxonomy (m2m)
  subGroups: DictionaryRef[];
  abilityTaxons: DictionaryRef[];
  modalities: DictionaryRef[];
  capabilities: DictionaryRef[];
  domains: DictionaryRef[];
  subdomains: DictionaryRef[];

  // Free-form
  skills: string[];
  abilityTags: string[];

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

  scores: BenchmarkScore[];
  datasetSubsamples: DatasetSubsample[];

  gigaMetricAdapterName?: string;
  gigaMetricSetUrl?: string;
  gigaMetricLaunchCommand?: string;
  gigaMetricsCodebaseUrl?: string;

  validationStatus?: BenchmarkValidationStatus;
  /** Present on authenticated author and management reads only. */
  catalogEntry?: CatalogEntry;
  isGenerated: boolean;
  jiraTicketId?: string;
  generatedAt?: string;
}

export interface BenchmarkTestListResponse {
  data: BenchmarkType[];
  total: number;
}

export interface BenchmarkTestListQuery {
  // Pagination / sort / search
  page?: number;
  limit?: number;
  sortColumn?: BenchmarkSortColumn;
  sortDirection?: SortDirection;
  search?: string;

  // Suite scoping
  suiteIds?: string[];

  // FK-backed taxonomy filters
  macroGroupIds?: string[];
  subGroupIds?: string[];
  abilityTaxonIds?: string[];
  taskTypeIds?: string[];
  modalityIds?: string[];
  languageIds?: string[];
  difficultyIds?: string[];
  capabilityIds?: string[];
  domainIds?: string[];
  subdomainIds?: string[];

  // Free-form filters
  skills?: string[];
  abilityTags?: string[];

  // Size range
  sizeMin?: number;
  sizeMax?: number;
}

export type SubGroupFilterOption = DictionaryRef & { macroGroupId: string };
export type SubdomainFilterOption = DictionaryRef & { domainId: string };

export interface BenchmarkTestFilterOptions {
  macroGroups: DictionaryRef[];
  subGroups: SubGroupFilterOption[];
  abilityTaxons: DictionaryRef[];
  taskTypes: DictionaryRef[];
  modalities: DictionaryRef[];
  languages: DictionaryRef[];
  difficulties: DictionaryRef[];
  capabilities: DictionaryRef[];
  domains: DictionaryRef[];
  subdomains: SubdomainFilterOption[];
  skills: string[];
  abilityTags: string[];
}
export interface CreateDatasetSubsampleDto {
  /** Send an existing id back on update to preserve DatasetSubsample identity. */
  id?: string;
  name: string;
  nameEn: string;
  description?: string;
  sizeInSamples?: number;
  medianSampleSizeWords?: number;
  requestLengthDist?: BenchmarkLengthDistribution;
  responseLengthDist?: BenchmarkLengthDistribution;
  split?: string;
  examples?: BenchmarkExample[];
}

export interface CreateBenchmarkTestDto {
  // Required
  suiteId: string;
  name: string;
  nameEn: string;
  description: string;

  // Optional scalars
  descriptionEn?: string;
  shortDescription?: string;
  taskDescription?: string;
  instructions?: string;
  instructionsEn?: string;

  // FK ids — single
  macroGroupId?: string | null;
  taskTypeId?: string | null;
  languageId?: string | null;
  difficultyId?: string | null;

  // FK ids — m2m
  subGroupIds?: string[];
  abilityTaxonIds?: string[];
  modalityIds?: string[];
  capabilityIds?: string[];
  domainIds?: string[];
  subdomainIds?: string[];

  // Free-form
  skills?: string[];
  abilityTags?: string[];

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

  sizeInSamples?: number;
  medianSampleSizeWords?: number;

  isDifficultyAutoCalculated?: boolean;
  difficultyCalculationComment?: string;

  gigaMetricAdapterName?: string;
  gigaMetricSetUrl?: string;
  gigaMetricLaunchCommand?: string;
  gigaMetricsCodebaseUrl?: string;

  isGenerated?: boolean;
  jiraTicketId?: string;

  // Nested objects
  codebase?: { name?: string; url: string } | null;
  requestLengthDist?: BenchmarkLengthDistribution;
  responseLengthDist?: BenchmarkLengthDistribution;

  // Arrays
  metrics?: string[];
  examples?: BenchmarkExample[];
  references?: BenchmarkReference[];
  links?: BenchmarkLinkItem[];
  datasetSubsamples?: CreateDatasetSubsampleDto[];
}

export type UpdateBenchmarkTestDto = Partial<CreateBenchmarkTestDto>;

export type SubmitCatalogEntryDto = CreateBenchmarkTestDto & {
  sourceConversationId?: string;
};

export interface ModerateCatalogEntryDto {
  status: Extract<BenchmarkValidationStatus, 'published' | 'rejected'>;
  rejectionReason?: string;
}

export interface CatalogSubmissionListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortDirection?: SortDirection;
  status?: BenchmarkValidationStatus;
}
