import { describe, expect, it } from 'vitest';
import { benchmarkFormToCreateDto } from './formToDto';

describe('benchmarkFormToCreateDto', () => {
  it('maps the full create form to the backend wire contract', () => {
    const dto = benchmarkFormToCreateDto({
      suiteId: '00000000-0000-4000-8000-000000000001',
      name: 'Medical QA',
      nameEn: 'Medical QA EN',
      description: 'Description',
      descriptionEn: 'Description EN',
      codebaseName: 'medical-qa',
      codebaseUrl: 'https://example.test/repository',
      paperTitle: 'Paper',
      paperUrl: 'https://example.test/paper',
      metrics: ' accuracy, f1, accuracy, , f1 ',
      instructions: 'Instructions',
      instructionsEn: 'Instructions EN',
      gigaMetricAdapterName: 'medical_adapter',
      gigaMetricSetUrl: 'https://example.test/metric-set',
      gigaMetricLaunchCommand: 'run medical',
      macroGroupId: 'macro-id',
      subGroupIds: ['subgroup-id'],
      abilityTaxonIds: ['ability-id'],
      taskTypeId: 'task-id',
      modalityIds: ['modality-id'],
      languageId: 'language-id',
      difficultyId: 'difficulty-id',
      capabilityIds: ['capability-id'],
      domainIds: ['domain-id'],
      subdomainIds: ['subdomain-id'],
      sizeInSamples: '100',
      medianSampleSizeWords: '20',
      examples: [{ input: 'Question', output: 'Answer' }],
    });

    expect(dto).toEqual({
      suiteId: '00000000-0000-4000-8000-000000000001',
      name: 'Medical QA',
      nameEn: 'Medical QA EN',
      description: 'Description',
      descriptionEn: 'Description EN',
      instructions: 'Instructions',
      instructionsEn: 'Instructions EN',
      macroGroupId: 'macro-id',
      subGroupIds: ['subgroup-id'],
      abilityTaxonIds: ['ability-id'],
      taskTypeId: 'task-id',
      modalityIds: ['modality-id'],
      languageId: 'language-id',
      difficultyId: 'difficulty-id',
      capabilityIds: ['capability-id'],
      domainIds: ['domain-id'],
      subdomainIds: ['subdomain-id'],
      sizeInSamples: 100,
      medianSampleSizeWords: 20,
      codebase: {
        name: 'medical-qa',
        url: 'https://example.test/repository',
      },
      references: [{ title: 'Paper', url: 'https://example.test/paper' }],
      metrics: ['accuracy', 'f1'],
      gigaMetricAdapterName: 'medical_adapter',
      gigaMetricSetUrl: 'https://example.test/metric-set',
      gigaMetricLaunchCommand: 'run medical',
      examples: [{ input: 'Question', output: 'Answer' }],
    });
  });

  it('omits empty optional values instead of sending invalid nested objects', () => {
    const dto = benchmarkFormToCreateDto({
      suiteId: '00000000-0000-4000-8000-000000000001',
      name: 'Minimal',
      nameEn: 'Minimal EN',
      description: 'Description',
      descriptionEn: '',
      codebaseName: 'ignored-without-url',
      codebaseUrl: '',
      paperTitle: '',
      paperUrl: '',
      metrics: ' , ',
      instructions: '',
      instructionsEn: '',
      gigaMetricAdapterName: '',
      gigaMetricSetUrl: '',
      gigaMetricLaunchCommand: '',
      macroGroupId: '',
      subGroupIds: [],
      abilityTaxonIds: [],
      taskTypeId: '',
      modalityIds: [],
      languageId: '',
      difficultyId: '',
      capabilityIds: [],
      domainIds: [],
      subdomainIds: [],
      sizeInSamples: '0',
      medianSampleSizeWords: '',
      examples: [],
    });

    expect(dto).toEqual({
      suiteId: '00000000-0000-4000-8000-000000000001',
      name: 'Minimal',
      nameEn: 'Minimal EN',
      description: 'Description',
    });
  });
});
