import { describe, expect, it } from 'vitest';
import type { BenchmarkType, DictionaryRef } from '@/types';
import type { BenchmarkFormData } from '../types';
import { buildPatchDiff } from './buildPatchDiff';

const ref = (id: string): DictionaryRef => ({
  id,
  name: id,
  nameEn: `${id}-en`,
});

function createOriginal(): BenchmarkType {
  return {
    id: 'test-id',
    suiteId: 'suite-id',
    name: 'Test',
    nameEn: 'Test EN',
    description: 'Description',
    descriptionEn: 'Description EN',
    codebase: { name: 'repo', url: 'https://example.test/repo' },
    metrics: ['accuracy', 'f1'],
    examples: [{ input: 'Question', output: 'Answer' }],
    instructions: 'Instructions',
    instructionsEn: 'Instructions EN',
    references: [{ title: 'Paper', url: 'https://example.test/paper' }],
    links: [],
    macroGroup: ref('macro-id'),
    subGroups: [ref('subgroup-a'), ref('subgroup-b')],
    abilityTaxons: [ref('ability-a'), ref('ability-b')],
    taskType: ref('task-id'),
    modalities: [ref('modality-a'), ref('modality-b')],
    language: ref('language-id'),
    difficulty: ref('difficulty-id'),
    capabilities: [ref('capability-a'), ref('capability-b')],
    domains: [ref('domain-a'), ref('domain-b')],
    subdomains: [ref('subdomain-a'), ref('subdomain-b')],
    skills: [],
    abilityTags: [],
    sizeInSamples: 100,
    medianSampleSizeWords: 20,
    requestLengthDist: { min: 1, median: 2, max: 3 },
    responseLengthDist: { min: 4, median: 5, max: 6 },
    scores: [],
    datasetSubsamples: [],
    gigaMetricAdapterName: 'adapter',
    gigaMetricSetUrl: 'https://example.test/set',
    gigaMetricLaunchCommand: 'run test',
    isGenerated: false,
  };
}

function createUnchangedForm(): BenchmarkFormData {
  return {
    suiteId: 'suite-id',
    name: 'Test',
    nameEn: 'Test EN',
    description: 'Description',
    descriptionEn: 'Description EN',
    metrics: 'f1, accuracy, accuracy',
    instructions: 'Instructions',
    instructionsEn: 'Instructions EN',
    macroGroupId: 'macro-id',
    subGroupIds: ['subgroup-b', 'subgroup-a'],
    abilityTaxonIds: ['ability-b', 'ability-a'],
    taskTypeId: 'task-id',
    modalityIds: ['modality-b', 'modality-a'],
    languageId: 'language-id',
    difficultyId: 'difficulty-id',
    capabilityIds: ['capability-b', 'capability-a'],
    sizeInSamples: '100',
    medianWords: '20',
    reqMin: '1',
    reqMedian: '2',
    reqMax: '3',
    respMin: '4',
    respMedian: '5',
    respMax: '6',
    domainIds: ['domain-b', 'domain-a'],
    subdomainIds: ['subdomain-b', 'subdomain-a'],
    codebaseName: 'repo',
    codebaseUrl: 'https://example.test/repo',
    references: [{ title: 'Paper', url: 'https://example.test/paper' }],
    adapterName: 'adapter',
    adapterSetUrl: 'https://example.test/set',
    launchCommand: 'run test',
    examples: [{ input: 'Question', output: 'Answer' }],
  };
}

describe('buildPatchDiff', () => {
  it('does not issue writes for reordered sets or duplicate CSV metrics', () => {
    expect(buildPatchDiff(createUnchangedForm(), createOriginal())).toEqual({});
  });

  it('uses explicit null and empty arrays when optional relations are cleared', () => {
    const form = createUnchangedForm();
    form.macroGroupId = '';
    form.subGroupIds = [];
    form.taskTypeId = '';
    form.languageId = '';
    form.difficultyId = '';
    form.codebaseName = '';
    form.codebaseUrl = '';
    form.metrics = '';
    form.references = [];
    form.examples = [];

    expect(buildPatchDiff(form, createOriginal())).toMatchObject({
      macroGroupId: null,
      subGroupIds: [],
      taskTypeId: null,
      languageId: null,
      difficultyId: null,
      codebase: null,
      metrics: [],
      references: [],
      examples: [],
    });
  });

  it('emits only changed scalar and ordered collection fields', () => {
    const form = createUnchangedForm();
    form.name = 'Renamed Test';
    form.sizeInSamples = '250';
    form.references = [
      { title: 'Second', url: 'https://example.test/second' },
      { title: 'Paper', url: 'https://example.test/paper' },
    ];

    expect(buildPatchDiff(form, createOriginal())).toEqual({
      name: 'Renamed Test',
      sizeInSamples: 250,
      references: [
        { title: 'Second', url: 'https://example.test/second' },
        { title: 'Paper', url: 'https://example.test/paper' },
      ],
    });
  });
});
