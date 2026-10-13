import { describe, expect, it } from 'vitest';
import { BenchmarkSortColumn, SortDirection } from '@/types';
import { CATALOG_QUERY_KEYS } from './queryKeys';
import {
  buildCatalogSearchParams,
  CATALOG_QUERY_KEY_GROUPS,
} from './buildCatalogSearchParams';

describe('buildCatalogSearchParams', () => {
  it('serializes the complete backend query contract with repeated array params', () => {
    const params = buildCatalogSearchParams({
      search: 'medical qa',
      page: 2,
      limit: 25,
      sortColumn: BenchmarkSortColumn.Name,
      sortDirection: SortDirection.Asc,
      suiteIds: ['suite-1', 'suite-2'],
      macroGroupIds: ['macro-1'],
      subGroupIds: ['sub-group-1'],
      abilityTaxonIds: ['ability-1'],
      taskTypeIds: ['task-1'],
      modalityIds: ['modality-1'],
      languageIds: ['language-1'],
      difficultyIds: ['difficulty-1'],
      capabilityIds: ['capability-1'],
      domainIds: ['domain-1', 'domain-2'],
      subdomainIds: ['subdomain-1'],
      skills: ['reasoning', 'retrieval'],
      abilityTags: ['factuality'],
      sizeMin: 10,
      sizeMax: 100,
    });

    expect(params.get('search')).toBe('medical qa');
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('25');
    expect(params.get('sortColumn')).toBe('name');
    expect(params.get('sortDirection')).toBe('ASC');
    expect(params.getAll('suiteIds')).toEqual(['suite-1', 'suite-2']);
    expect(params.getAll('domainIds')).toEqual(['domain-1', 'domain-2']);
    expect(params.getAll('skills')).toEqual(['reasoning', 'retrieval']);
    expect([...new Set(params.keys())].sort()).toEqual(
      [
        ...CATALOG_QUERY_KEY_GROUPS.string,
        ...CATALOG_QUERY_KEY_GROUPS.number,
        ...CATALOG_QUERY_KEY_GROUPS.array,
      ].sort(),
    );
  });

  it('omits empty and non-finite values without dropping valid zero bounds', () => {
    const params = buildCatalogSearchParams({
      search: '',
      page: Number.NaN,
      limit: Number.POSITIVE_INFINITY,
      suiteIds: [],
      skills: ['', 'kept'],
      sizeMin: 0,
      sizeMax: undefined,
    });

    expect(params.toString()).toBe('sizeMin=0&skills=kept');
  });
});

describe('catalog query keys', () => {
  it('canonicalizes array order and duplicates to prevent duplicate cache entries', () => {
    const first = CATALOG_QUERY_KEYS.list({
      domainIds: ['b', 'a', 'a'],
      suiteIds: ['2', '1'],
      page: 1,
    });
    const second = CATALOG_QUERY_KEYS.list({
      page: 1,
      suiteIds: ['1', '2'],
      domainIds: ['a', 'b'],
    });

    expect(first).toEqual(second);
  });
});
