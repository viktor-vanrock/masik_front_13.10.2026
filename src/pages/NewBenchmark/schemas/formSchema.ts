import { z } from 'zod';

export interface BenchmarkFormValidationMessages {
  invalidUrl: string;
  suiteIdRequired: string;
  nameRequired: string;
  nameEnRequired: string;
  descriptionRequired: string;
  macroGroupRequired: string;
  subGroupsRequired: string;
  abilityTaxonsRequired: string;
  taskTypeRequired: string;
  modalityRequired: string;
  languageRequired: string;
  difficultyRequired: string;
  sizeInSamplesPositive: string;
  domainsRequired: string;
  exampleInputRequired: string;
  exampleOutputRequired: string;
  examplesRequired: string;
}

export const buildBenchmarkFormSchemas = (m: BenchmarkFormValidationMessages) => {
  const optionalUrl = z.string().url(m.invalidUrl).optional().or(z.literal(''));

  const form = z.object({
    suiteId: z.string().uuid(m.suiteIdRequired),
    name: z.string().optional(),
    nameEn: z.string().optional(),
    description: z.string().optional(),
    descriptionEn: z.string().optional(),
    codebaseName: z.string().optional(),
    codebaseUrl: optionalUrl,
    paperTitle: z.string().optional(),
    paperUrl: optionalUrl,
    metrics: z.string().optional(),
    instructions: z.string().optional(),
    instructionsEn: z.string().optional(),
    gigaMetricAdapterName: z.string().optional(),
    gigaMetricSetUrl: optionalUrl,
    gigaMetricLaunchCommand: z.string().optional(),
    // id-based taxonomy (FK)
    macroGroupId: z.string().optional(),
    subGroupIds: z.array(z.string()).optional(),
    abilityTaxonIds: z.array(z.string()).optional(),
    taskTypeId: z.string().optional(),
    modalityIds: z.array(z.string()).optional(),
    languageId: z.string().optional(),
    difficultyId: z.string().optional(),
    capabilityIds: z.array(z.string()).optional(),
    domainIds: z.array(z.string()).optional(),
    subdomainIds: z.array(z.string()).optional(),
    sizeInSamples: z.string().optional(),
    medianSampleSizeWords: z.string().optional(),
    examples: z.array(z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    })).optional(),
  });

  const step1 = z.object({
    suiteId: z.string().uuid(m.suiteIdRequired),
    name: z.string().min(1, m.nameRequired),
    nameEn: z.string().min(1, m.nameEnRequired),
    description: z.string().min(1, m.descriptionRequired),
    codebaseUrl: optionalUrl,
    paperUrl: optionalUrl,
    gigaMetricSetUrl: optionalUrl,
  });

  const step2 = z.object({
    macroGroupId: z.string().min(1, m.macroGroupRequired),
    subGroupIds: z.array(z.string()).min(1, m.subGroupsRequired),
    abilityTaxonIds: z.array(z.string()).min(1, m.abilityTaxonsRequired),
  });

  const step3 = z.object({
    taskTypeId: z.string().min(1, m.taskTypeRequired),
    modalityIds: z.array(z.string()).min(1, m.modalityRequired),
    languageId: z.string().min(1, m.languageRequired),
    difficultyId: z.string().min(1, m.difficultyRequired),
    sizeInSamples: z.coerce.number().min(1, m.sizeInSamplesPositive).optional(),
  });

  const step4 = z.object({
    domainIds: z.array(z.string()).min(1, m.domainsRequired),
  });

  const step5 = z.object({
    examples: z.array(z.object({
      input: z.string().min(1, m.exampleInputRequired),
      output: z.string().min(1, m.exampleOutputRequired),
      explanation: z.string().optional(),
    })).min(1, m.examplesRequired),
  });

  return { form, step1, step2, step3, step4, step5 };
};

export type BenchmarkFormSchemas = ReturnType<typeof buildBenchmarkFormSchemas>;
export type BenchmarkFormData = z.infer<BenchmarkFormSchemas['form']>;

export const STEP_FIELDS = {
  0: [
    'suiteId', 'name', 'nameEn', 'description', 'descriptionEn',
    'codebaseName', 'codebaseUrl', 'paperTitle', 'paperUrl',
    'metrics', 'instructions', 'instructionsEn',
    'gigaMetricAdapterName', 'gigaMetricSetUrl', 'gigaMetricLaunchCommand',
  ],
  1: ['macroGroupId', 'subGroupIds', 'abilityTaxonIds'],
  2: ['taskTypeId', 'modalityIds', 'languageId', 'difficultyId', 'sizeInSamples'],
  3: ['domainIds', 'subdomainIds'],
  4: ['examples'],
} as const;
