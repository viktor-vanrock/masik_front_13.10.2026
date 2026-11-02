import type { BenchmarkType, UpdateBenchmarkTestDto, BenchmarkExample, BenchmarkLengthDistribution } from '@/types';
import type { BenchmarkFormData } from '../types';

const sortedEquals = (a: string[], b: string[]): boolean => {
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
};

const examplesEqual = (a: BenchmarkExample[], b: BenchmarkExample[]): boolean =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.input === b[i].input &&
      x.output === b[i].output &&
      (x.explanation ?? '') === (b[i].explanation ?? ''),
  );

const refsEqual = (
  a: { title: string; url: string }[],
  b: { title: string; url: string }[],
): boolean =>
  a.length === b.length && a.every((x, i) => x.title === b[i].title && x.url === b[i].url);

const distEqual = (
  a: BenchmarkLengthDistribution | undefined,
  b: { min: number; median: number; max: number },
): boolean => !!a && a.min === b.min && a.median === b.median && a.max === b.max;

export function buildPatchDiff(
  form: BenchmarkFormData,
  original: BenchmarkType,
): UpdateBenchmarkTestDto {
  const patch: UpdateBenchmarkTestDto = {};

  if (form.suiteId && form.suiteId !== original.suiteId) patch.suiteId = form.suiteId;

  if (form.name !== original.name) patch.name = form.name;
  if (form.nameEn !== original.nameEn) patch.nameEn = form.nameEn;
  if (form.description !== original.description) patch.description = form.description;
  if (form.descriptionEn !== (original.descriptionEn ?? '')) patch.descriptionEn = form.descriptionEn;
  if (form.instructions !== (original.instructions ?? '')) patch.instructions = form.instructions;
  if (form.instructionsEn !== (original.instructionsEn ?? '')) patch.instructionsEn = form.instructionsEn;

  // Taxonomy — compare ids
  const origMacroGroupId = original.macroGroup?.id ?? '';
  if (form.macroGroupId !== origMacroGroupId) patch.macroGroupId = form.macroGroupId || null;

  const origSubGroupIds = original.subGroups.map((s) => s.id);
  if (!sortedEquals(form.subGroupIds, origSubGroupIds)) patch.subGroupIds = form.subGroupIds;

  const origAbilityTaxonIds = original.abilityTaxons.map((a) => a.id);
  if (!sortedEquals(form.abilityTaxonIds, origAbilityTaxonIds)) patch.abilityTaxonIds = form.abilityTaxonIds;

  // Parameters — compare ids
  const origTaskTypeId = original.taskType?.id ?? '';
  if (form.taskTypeId !== origTaskTypeId) patch.taskTypeId = form.taskTypeId || null;

  const origModalityIds = original.modalities.map((m) => m.id);
  if (!sortedEquals(form.modalityIds, origModalityIds)) patch.modalityIds = form.modalityIds;

  const origLanguageId = original.language?.id ?? '';
  if (form.languageId !== origLanguageId) patch.languageId = form.languageId || null;

  const origDifficultyId = original.difficulty?.id ?? '';
  if (form.difficultyId !== origDifficultyId) patch.difficultyId = form.difficultyId || null;

  const origCapabilityIds = original.capabilities.map((c) => c.id);
  if (!sortedEquals(form.capabilityIds, origCapabilityIds)) patch.capabilityIds = form.capabilityIds;

  // Numerics
  const newSize = Number(form.sizeInSamples) || 0;
  if (newSize !== (original.sizeInSamples ?? 0)) patch.sizeInSamples = newSize;
  const newMedian = Number(form.medianWords) || 0;
  if (newMedian !== (original.medianSampleSizeWords ?? 0)) patch.medianSampleSizeWords = newMedian;

  const newReqDist = {
    min: Number(form.reqMin) || 0,
    median: Number(form.reqMedian) || 0,
    max: Number(form.reqMax) || 0,
  };
  if (!distEqual(original.requestLengthDist, newReqDist)) patch.requestLengthDist = newReqDist;

  const newRespDist = {
    min: Number(form.respMin) || 0,
    median: Number(form.respMedian) || 0,
    max: Number(form.respMax) || 0,
  };
  if (!distEqual(original.responseLengthDist, newRespDist)) patch.responseLengthDist = newRespDist;

  // Metrics CSV → string[]
  const newMetrics = [
    ...new Set(
      form.metrics
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  ];
  if (!sortedEquals(newMetrics, original.metrics)) patch.metrics = newMetrics;

  // Domains — compare ids
  const origDomainIds = original.domains.map((d) => d.id);
  if (!sortedEquals(form.domainIds, origDomainIds)) patch.domainIds = form.domainIds;

  const origSubdomainIds = original.subdomains.map((s) => s.id);
  if (!sortedEquals(form.subdomainIds, origSubdomainIds)) patch.subdomainIds = form.subdomainIds;

  // Codebase
  if (form.codebaseUrl !== (original.codebase?.url ?? '') || form.codebaseName !== (original.codebase?.name ?? '')) {
    patch.codebase = form.codebaseUrl
      ? { name: form.codebaseName || undefined, url: form.codebaseUrl }
      : null;
  }

  // References
  const origRefs = (original.references ?? []).map((r) => ({ title: r.title, url: r.url }));
  if (!refsEqual(form.references, origRefs)) patch.references = form.references;

  // GigaMetric
  if (form.adapterName !== (original.gigaMetricAdapterName ?? '')) patch.gigaMetricAdapterName = form.adapterName;
  if (form.adapterSetUrl !== (original.gigaMetricSetUrl ?? '')) patch.gigaMetricSetUrl = form.adapterSetUrl;
  if (form.launchCommand !== (original.gigaMetricLaunchCommand ?? '')) patch.gigaMetricLaunchCommand = form.launchCommand;

  // Examples
  if (!examplesEqual(form.examples, original.examples ?? [])) patch.examples = form.examples;

  return patch;
}
