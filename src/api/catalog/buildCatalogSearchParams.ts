import type { BenchmarkTestListQuery } from '@/types';

type Key = keyof BenchmarkTestListQuery;

const STRING_KEYS = [
  'search',
  'sortColumn',
  'sortDirection',
] as const satisfies readonly Key[];

const NUMBER_KEYS = [
  'page',
  'limit',
  'sizeMin',
  'sizeMax',
] as const satisfies readonly Key[];

const ARRAY_KEYS = [
  'suiteIds',
  'macroGroupIds',
  'subGroupIds',
  'abilityTaxonIds',
  'taskTypeIds',
  'modalityIds',
  'languageIds',
  'difficultyIds',
  'capabilityIds',
  'domainIds',
  'subdomainIds',
  'skills',
  'abilityTags',
] as const satisfies readonly Key[];

/**
 * Repeated-param serializer (`?ids=a&ids=b`). Skips undefined / '' /
 * non-finite / [].
 */
export function buildCatalogSearchParams(
  query: BenchmarkTestListQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of STRING_KEYS) {
    const value = query[key];
    if (typeof value === 'string' && value !== '') {
      params.append(key, value);
    }
  }

  for (const key of NUMBER_KEYS) {
    const value = query[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      params.append(key, String(value));
    }
  }

  for (const key of ARRAY_KEYS) {
    const value = query[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item !== '') {
          params.append(key, item);
        }
      }
    }
  }

  return params;
}

export const CATALOG_QUERY_KEY_GROUPS = {
  string: STRING_KEYS,
  number: NUMBER_KEYS,
  array: ARRAY_KEYS,
} as const;
