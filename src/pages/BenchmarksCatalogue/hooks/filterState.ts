import { buildCatalogSearchParams } from '@/api/catalog';
import type { BenchmarkTestListQuery } from '@/types';

export interface CatalogFilterState {
  search: string;
  suiteIds: string[];
  macroGroupIds: string[];
  subGroupIds: string[];
  abilityTaxonIds: string[];
  taskTypeIds: string[];
  modalityIds: string[];
  languageIds: string[];
  difficultyIds: string[];
  capabilityIds: string[];
  domainIds: string[];
  subdomainIds: string[];
  skills: string[];
  abilityTags: string[];
  sizeMin: number | undefined;
  sizeMax: number | undefined;
}

export const ID_MULTISELECT_KEYS = [
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
] as const satisfies readonly (keyof CatalogFilterState)[];

export const FREE_FORM_MULTISELECT_KEYS = [
  'skills',
  'abilityTags',
] as const satisfies readonly (keyof CatalogFilterState)[];

export const CATALOG_MULTISELECT_KEYS = [
  ...ID_MULTISELECT_KEYS,
  ...FREE_FORM_MULTISELECT_KEYS,
] as const;

export type CatalogMultiselectKey =
  (typeof CATALOG_MULTISELECT_KEYS)[number];

export const DEFAULT_CATALOG_FILTERS: CatalogFilterState = {
  search: '',
  suiteIds: [],
  macroGroupIds: [],
  subGroupIds: [],
  abilityTaxonIds: [],
  taskTypeIds: [],
  modalityIds: [],
  languageIds: [],
  difficultyIds: [],
  capabilityIds: [],
  domainIds: [],
  subdomainIds: [],
  skills: [],
  abilityTags: [],
  sizeMin: undefined,
  sizeMax: undefined,
};

/** Changing a parent key wipes its child arrays. */
export const CASCADE_RESETS = {
  macroGroupIds: ['subGroupIds'] as const,
  domainIds: ['subdomainIds'] as const,
} as const satisfies Partial<
  Record<keyof CatalogFilterState, readonly CatalogMultiselectKey[]>
>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function collectArray(
  params: URLSearchParams,
  key: string,
  validator?: (v: string) => boolean,
): string[] {
  const seen = new Set<string>();
  for (const raw of params.getAll(key)) {
    if (raw === '') continue;
    if (validator && !validator(raw)) continue;
    seen.add(raw);
  }
  return Array.from(seen);
}

function readFiniteNumber(
  params: URLSearchParams,
  key: string,
): number | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Parser tolerates malformed URL values: invalid UUIDs are silently dropped
 * for id-fields so we never round-trip them to BE (would produce 400).
 * Free-form fields (`skills`/`abilityTags`) skip validation.
 */
export function parseFilterStateFromSearch(
  params: URLSearchParams,
): CatalogFilterState {
  const state: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTERS,
  };

  const search = params.get('search');
  if (search !== null) state.search = search;

  for (const key of ID_MULTISELECT_KEYS) {
    state[key] = collectArray(params, key, isUuid);
  }
  for (const key of FREE_FORM_MULTISELECT_KEYS) {
    state[key] = collectArray(params, key);
  }

  state.sizeMin = readFiniteNumber(params, 'sizeMin');
  state.sizeMax = readFiniteNumber(params, 'sizeMax');

  return state;
}

export function filterStateToQuery(
  state: CatalogFilterState,
  effectiveSearch: string,
): BenchmarkTestListQuery {
  const q: BenchmarkTestListQuery = {};

  const trimmed = effectiveSearch.trim();
  if (trimmed !== '') q.search = trimmed;

  for (const key of ID_MULTISELECT_KEYS) {
    if (state[key].length > 0) q[key] = state[key];
  }
  for (const key of FREE_FORM_MULTISELECT_KEYS) {
    if (state[key].length > 0) q[key] = state[key];
  }
  // sizeMin=0 is treated as "no minimum" (matches legacy semantics).
  if (typeof state.sizeMin === 'number' && state.sizeMin > 0) {
    q.sizeMin = state.sizeMin;
  }
  if (typeof state.sizeMax === 'number' && Number.isFinite(state.sizeMax)) {
    q.sizeMax = state.sizeMax;
  }
  return q;
}

export function buildSearchParamsFromFilterState(
  state: CatalogFilterState,
  effectiveSearch: string,
): URLSearchParams {
  return buildCatalogSearchParams(
    filterStateToQuery(state, effectiveSearch),
  );
}

export function countActiveFilters(state: CatalogFilterState): number {
  let count = 0;
  for (const key of CATALOG_MULTISELECT_KEYS) {
    if (state[key].length > 0) count++;
  }
  if (typeof state.sizeMin === 'number' && state.sizeMin > 0) count++;
  if (typeof state.sizeMax === 'number' && Number.isFinite(state.sizeMax)) count++;
  return count;
}

/**
 * Order-insensitive serialization for equality checks between two
 * URLSearchParams instances — prevents unnecessary `setSearchParams` calls
 * and the resulting state ↔ URL feedback loop.
 */
export function canonicalSearchString(params: URLSearchParams): string {
  const groups = new Map<string, string[]>();
  for (const [k, v] of params.entries()) {
    const bucket = groups.get(k);
    if (bucket) bucket.push(v);
    else groups.set(k, [v]);
  }
  const out: string[] = [];
  for (const key of Array.from(groups.keys()).sort()) {
    const values = groups.get(key);
    if (!values) continue;
    for (const v of values.slice().sort()) {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return out.join('&');
}
