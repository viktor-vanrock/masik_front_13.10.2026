import type { CreateBenchmarkTestDto } from '@/types';
import type { BenchmarkFormData } from '@/pages/NewBenchmark/schemas/formSchema';

export function benchmarkFormToCreateDto(data: BenchmarkFormData): CreateBenchmarkTestDto {
  const dto: CreateBenchmarkTestDto = {
    suiteId: data.suiteId,
    name: data.name ?? '',
    nameEn: data.nameEn ?? '',
    description: data.description ?? '',
  };

  if (data.descriptionEn) dto.descriptionEn = data.descriptionEn;
  if (data.instructions) dto.instructions = data.instructions;
  if (data.instructionsEn) dto.instructionsEn = data.instructionsEn;

  // FK taxonomy
  if (data.macroGroupId) dto.macroGroupId = data.macroGroupId;
  if (data.subGroupIds?.length) dto.subGroupIds = data.subGroupIds;
  if (data.abilityTaxonIds?.length) dto.abilityTaxonIds = data.abilityTaxonIds;
  if (data.taskTypeId) dto.taskTypeId = data.taskTypeId;
  if (data.modalityIds?.length) dto.modalityIds = data.modalityIds;
  if (data.languageId) dto.languageId = data.languageId;
  if (data.difficultyId) dto.difficultyId = data.difficultyId;
  if (data.capabilityIds?.length) dto.capabilityIds = data.capabilityIds;
  if (data.domainIds?.length) dto.domainIds = data.domainIds;
  if (data.subdomainIds?.length) dto.subdomainIds = data.subdomainIds;

  // Numerics
  const size = Number(data.sizeInSamples);
  if (size > 0) dto.sizeInSamples = size;
  const median = Number(data.medianSampleSizeWords);
  if (median > 0) dto.medianSampleSizeWords = median;

  // Nested: codebase
  if (data.codebaseUrl) {
    dto.codebase = { name: data.codebaseName || undefined, url: data.codebaseUrl };
  }

  // Nested: references (paper)
  if (data.paperTitle || data.paperUrl) {
    dto.references = [{ title: data.paperTitle ?? '', url: data.paperUrl ?? '' }];
  }

  // Metrics (comma-separated → string[])
  if (data.metrics) {
    const arr = [
      ...new Set(
        data.metrics
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (arr.length) dto.metrics = arr;
  }

  // GigaMetric
  if (data.gigaMetricAdapterName) dto.gigaMetricAdapterName = data.gigaMetricAdapterName;
  if (data.gigaMetricSetUrl) dto.gigaMetricSetUrl = data.gigaMetricSetUrl;
  if (data.gigaMetricLaunchCommand) dto.gigaMetricLaunchCommand = data.gigaMetricLaunchCommand;

  // Examples
  if (data.examples?.length) dto.examples = data.examples;

  return dto;
}
