import type {
  BenchmarkTestListQuery,
  CatalogSubmissionListQuery,
} from '@/types';

function canonicalize(query: BenchmarkTestListQuery): BenchmarkTestListQuery {
  const sortedKeys = Object.keys(query).sort() as (keyof BenchmarkTestListQuery)[];
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const value = query[key];
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      const normalized = Array.from(new Set(value));
      normalized.sort();
      result[key] = normalized;
    } else {
      result[key] = value;
    }
  }
  return result as BenchmarkTestListQuery;
}

export const CATALOG_QUERY_KEYS = {
  all: ['catalog'] as const,
  lists: () => [...CATALOG_QUERY_KEYS.all, 'list'] as const,
  list: (query: BenchmarkTestListQuery) =>
    [...CATALOG_QUERY_KEYS.lists(), canonicalize(query)] as const,
  details: () => [...CATALOG_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATALOG_QUERY_KEYS.details(), id] as const,
  managementLists: () =>
    [...CATALOG_QUERY_KEYS.all, 'management', 'list'] as const,
  managementList: (query: BenchmarkTestListQuery) =>
    [...CATALOG_QUERY_KEYS.managementLists(), canonicalize(query)] as const,
  managementDetails: () =>
    [...CATALOG_QUERY_KEYS.all, 'management', 'detail'] as const,
  managementDetail: (id: string) =>
    [...CATALOG_QUERY_KEYS.managementDetails(), id] as const,
  submissions: () => [...CATALOG_QUERY_KEYS.all, 'submissions'] as const,
  mySubmissionLists: () =>
    [...CATALOG_QUERY_KEYS.submissions(), 'mine', 'list'] as const,
  mySubmissionList: (query: CatalogSubmissionListQuery) =>
    [...CATALOG_QUERY_KEYS.mySubmissionLists(), query] as const,
  mySubmissionDetails: () =>
    [...CATALOG_QUERY_KEYS.submissions(), 'mine', 'detail'] as const,
  mySubmissionDetail: (id: string) =>
    [...CATALOG_QUERY_KEYS.mySubmissionDetails(), id] as const,
  filterOptions: () => [...CATALOG_QUERY_KEYS.all, 'filterOptions'] as const,

  groups: () => [...CATALOG_QUERY_KEYS.all, 'groups'] as const,
  group: (query: BenchmarkTestListQuery) =>
    [...CATALOG_QUERY_KEYS.groups(), canonicalize(query)] as const,

  suites: () => [...CATALOG_QUERY_KEYS.all, 'suites'] as const,
  suiteLists: () => [...CATALOG_QUERY_KEYS.suites(), 'list'] as const,
  suiteList: (query: SuitesListQuery) =>
    [...CATALOG_QUERY_KEYS.suiteLists(), canonicalize(query as unknown as BenchmarkTestListQuery)] as const,
  suiteDetails: () => [...CATALOG_QUERY_KEYS.suites(), 'detail'] as const,
  suiteDetail: (id: string) => [...CATALOG_QUERY_KEYS.suiteDetails(), id] as const,
  suiteOptions: () => [...CATALOG_QUERY_KEYS.suites(), 'options'] as const,
} as const;

export interface SuitesListQuery {
  search?: string;
  page?: number;
  limit?: number;
}
