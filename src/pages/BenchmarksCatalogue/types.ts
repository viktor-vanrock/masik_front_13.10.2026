import type { BenchmarkGroup, BenchmarkType } from '@/types';

export type CatalogFilterKey = 'suites' | 'language' | 'modality' | 'taskType' | 'difficulty' | 'capability' | 'domain' | 'subdomain' | 'macroGroup' | 'subGroup' | 'abilityTaxon' | 'abilityTag';
export type CatalogFilterValues = Record<CatalogFilterKey, string[]>;
export type CatalogFilterOptions = { suites: string[]; language: string[]; modality: string[]; taskType: string[]; difficulty: string[]; capability: string[]; domain: string[]; subdomain: string[]; macroGroup: string[]; subGroup: string[]; abilityTaxon: string[]; abilityTag: string[]; domainChildren: Record<string, string[]>; macroChildren: Record<string, string[]> };
export type CatalogItem = {
  id: string; name: string; subtitle: string; description: string; domain: string;
  origin: string; difficulty: string; language: string; metric: string;
  samples: number; status: string; tags: string[]; capabilities: string[];
  validatedByUmr?: boolean; source?: string; authorId?: string;
  validationStatus?: BenchmarkType['validationStatus'];
  confidentiality?: string;
  benchmark: BenchmarkType;
};
export type CatalogGroup = {
  suite: BenchmarkGroup['benchmark'];
  tests: CatalogItem[];
};