import type { BenchmarkExample } from '@/types';

export interface BenchmarkFormData {
  suiteId: string;

  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  metrics: string;
  instructions: string;
  instructionsEn: string;

  // Taxonomy — id-based
  macroGroupId: string;
  subGroupIds: string[];
  abilityTaxonIds: string[];

  // Parameters — id-based
  taskTypeId: string;
  modalityIds: string[];
  languageId: string;
  difficultyId: string;
  capabilityIds: string[];

  // Sizes
  sizeInSamples: string;
  medianWords: string;
  reqMin: string;
  reqMedian: string;
  reqMax: string;
  respMin: string;
  respMedian: string;
  respMax: string;

  // Domains — id-based
  domainIds: string[];
  subdomainIds: string[];

  codebaseName: string;
  codebaseUrl: string;

  references: { title: string; url: string }[];

  adapterName: string;
  adapterSetUrl: string;
  launchCommand: string;

  examples: BenchmarkExample[];
}

export interface FormActions {
  toggleSubGroupId: (id: string) => void;
  toggleAbilityTaxonId: (id: string) => void;
  toggleModalityId: (id: string) => void;
  toggleCapabilityId: (id: string) => void;
  toggleDomainId: (id: string) => void;
  toggleSubdomainId: (id: string) => void;
  addReference: () => void;
  removeReference: (i: number) => void;
  updateReference: (i: number, field: 'title' | 'url', val: string) => void;
  addExample: () => void;
  removeExample: (i: number) => void;
  updateExample: (i: number, field: keyof BenchmarkExample, val: string) => void;
}
