import { describe, expect, it } from 'vitest';
import {
  buildSearchParamsFromFilterState,
  canonicalSearchString,
  countActiveFilters,
  DEFAULT_CATALOG_FILTERS,
  filterStateToQuery,
  parseFilterStateFromSearch,
} from './filterState';

const firstUuid = '00000000-0000-4000-8000-000000000001';
const secondUuid = '00000000-0000-4000-8000-000000000002';

describe('catalog filter URL state', () => {
  it('drops malformed IDs and deduplicates repeated values from a shared URL', () => {
    const params = new URLSearchParams();
    params.append('search', ' medical ');
    params.append('domainIds', firstUuid);
    params.append('domainIds', 'not-a-uuid');
    params.append('domainIds', firstUuid);
    params.append('skills', 'reasoning');
    params.append('skills', 'reasoning');
    params.append('sizeMin', '10');
    params.append('sizeMax', 'not-a-number');

    expect(parseFilterStateFromSearch(params)).toEqual({
      ...DEFAULT_CATALOG_FILTERS,
      search: ' medical ',
      domainIds: [firstUuid],
      skills: ['reasoning'],
      sizeMin: 10,
    });
  });

  it('round-trips all active filters through repeated URL parameters', () => {
    const state = {
      ...DEFAULT_CATALOG_FILTERS,
      suiteIds: [firstUuid, secondUuid],
      subGroupIds: [secondUuid],
      domainIds: [firstUuid],
      subdomainIds: [secondUuid],
      skills: ['reasoning'],
      abilityTags: ['quality'],
      sizeMin: 1,
      sizeMax: 100,
    };

    const params = buildSearchParamsFromFilterState(state, '  medical qa  ');

    expect(params.getAll('suiteIds')).toEqual([firstUuid, secondUuid]);
    expect(parseFilterStateFromSearch(params)).toEqual({
      ...state,
      search: 'medical qa',
    });
    expect(countActiveFilters(state)).toBe(8);
  });

  it('distinguishes absent minimum size from a valid zero maximum', () => {
    const query = filterStateToQuery(
      {
        ...DEFAULT_CATALOG_FILTERS,
        sizeMin: 0,
        sizeMax: 0,
      },
      '   '
    );

    expect(query).toEqual({ sizeMax: 0 });
  });

  it('canonicalizes parameter and value order for URL equality checks', () => {
    const first = new URLSearchParams();
    first.append('domainIds', secondUuid);
    first.append('search', 'qa');
    first.append('domainIds', firstUuid);

    const second = new URLSearchParams();
    second.append('domainIds', firstUuid);
    second.append('domainIds', secondUuid);
    second.append('search', 'qa');

    expect(canonicalSearchString(first)).toBe(canonicalSearchString(second));
  });
});
