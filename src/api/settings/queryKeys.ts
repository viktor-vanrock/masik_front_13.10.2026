import type {
  DictionaryCategory,
  DictionaryPair,
  DictionarySettingsListQuery,
} from '@/types';

function canonicalize(query: DictionarySettingsListQuery): DictionarySettingsListQuery {
  const sortedKeys = Object.keys(query).sort() as (keyof DictionarySettingsListQuery)[];
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    const value = query[key];
    if (value !== undefined) result[key] = value;
  }
  return result as DictionarySettingsListQuery;
}

export const SETTINGS_QUERY_KEYS = {
  all: ['settings'] as const,
  aggregate: () => [...SETTINGS_QUERY_KEYS.all, 'aggregate'] as const,
  pair: <C extends DictionaryCategory>(pair: DictionaryPair<C>) =>
    [...SETTINGS_QUERY_KEYS.all, pair.category, pair.type] as const,
  lists: <C extends DictionaryCategory>(pair: DictionaryPair<C>) =>
    [...SETTINGS_QUERY_KEYS.pair(pair), 'list'] as const,
  list: <C extends DictionaryCategory>(
    pair: DictionaryPair<C>,
    query: DictionarySettingsListQuery = {},
  ) => [...SETTINGS_QUERY_KEYS.lists(pair), canonicalize(query)] as const,
  details: <C extends DictionaryCategory>(pair: DictionaryPair<C>) =>
    [...SETTINGS_QUERY_KEYS.pair(pair), 'detail'] as const,
  detail: <C extends DictionaryCategory>(pair: DictionaryPair<C>, id: string) =>
    [...SETTINGS_QUERY_KEYS.details(pair), id] as const,
} as const;
