import type { DictionaryRef } from '@/types';
import type { BenchmarkType, DatasetSubsample } from '@/types';
import { pickLocalizedName, pickLocalizedString } from './pickLocalizedName';
import type {
  AppLang,
  BenchmarkTestVM,
  DatasetSubsampleVM,
  TaxonomyLabel,
} from './types';

function toLabel(ref: DictionaryRef, lang: AppLang): TaxonomyLabel {
  return { id: ref.id, label: pickLocalizedName(ref, lang) };
}

function toLabelOrNull(
  ref: DictionaryRef | null,
  lang: AppLang,
): TaxonomyLabel | null {
  return ref ? toLabel(ref, lang) : null;
}

function toLabels(refs: DictionaryRef[], lang: AppLang): TaxonomyLabel[] {
  return refs.map((ref) => toLabel(ref, lang));
}

export function selectDatasetSubsampleVM(
  sd: DatasetSubsample,
  lang: AppLang,
): DatasetSubsampleVM {
  return {
    id: sd.id,
    name: sd.name,
    nameEn: sd.nameEn,
    displayName: pickLocalizedString(sd.name, sd.nameEn, lang),
    description: sd.description,
    split: sd.split,
    sizeInSamples: sd.sizeInSamples,
    medianSampleSizeWords: sd.medianSampleSizeWords,
    requestLengthDist: sd.requestLengthDist,
    responseLengthDist: sd.responseLengthDist,
    examples: sd.examples,
  };
}

export function selectBenchmarkTestVM(
  test: BenchmarkType,
  lang: AppLang,
): BenchmarkTestVM {
  return {
    id: test.id,
    suiteId: test.suiteId,
    name: test.name,
    nameEn: test.nameEn,
    displayName: pickLocalizedString(test.name, test.nameEn, lang),
    displayDescription: pickLocalizedString(
      test.description,
      test.descriptionEn,
      lang,
    ),
    shortDescription: test.shortDescription,
    taskDescription: test.taskDescription,
    instructions: pickLocalizedString(
      test.instructions,
      test.instructionsEn,
      lang,
    ),

    macroGroup: toLabelOrNull(test.macroGroup, lang),
    taskType: toLabelOrNull(test.taskType, lang),
    language: toLabelOrNull(test.language, lang),
    difficulty: toLabelOrNull(test.difficulty, lang),
    subGroups: toLabels(test.subGroups, lang),
    abilityTaxons: toLabels(test.abilityTaxons, lang),
    modalities: toLabels(test.modalities, lang),
    capabilities: toLabels(test.capabilities, lang),
    domains: toLabels(test.domains, lang),
    subdomains: toLabels(test.subdomains, lang),

    skills: test.skills,
    abilityTags: test.abilityTags,

    metrics: test.metrics,
    examples: test.examples,
    references: test.references,
    links: test.links,
    codebase: test.codebase,
    scores: test.scores,
    datasetSubsamples: test.datasetSubsamples.map((sd) => selectDatasetSubsampleVM(sd, lang)),

    sizeInSamples: test.sizeInSamples,
    medianSampleSizeWords: test.medianSampleSizeWords,
    requestLengthDist: test.requestLengthDist,
    responseLengthDist: test.responseLengthDist,

    confidenceScore: test.confidenceScore,
    confidentialityLevel: test.confidentialityLevel,
    knowledgeLevel: test.knowledgeLevel,
    importance: test.importance,
    importanceComment: test.importanceComment,

    contextFieldFormat: test.contextFieldFormat,
    answerFieldFormat: test.answerFieldFormat,
    evaluationLogic: test.evaluationLogic,

    humanBaseline: test.humanBaseline,
    humanBaselineNotes: test.humanBaselineNotes,

    recommendedMetricsDescription: test.recommendedMetricsDescription,
    requiredGigaChatQualityLevel: test.requiredGigaChatQualityLevel,

    gigaMetricAdapterName: test.gigaMetricAdapterName,
    gigaMetricSetUrl: test.gigaMetricSetUrl,
    gigaMetricLaunchCommand: test.gigaMetricLaunchCommand,
    gigaMetricsCodebaseUrl: test.gigaMetricsCodebaseUrl,

    validationStatus: test.validationStatus,
    isGenerated: test.isGenerated,
    jiraTicketId: test.jiraTicketId,
    generatedAt: test.generatedAt,
  };
}
