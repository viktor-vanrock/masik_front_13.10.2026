import type { DictionarySettingsListQuery } from '@/types';

/**
 * Serializer for `GET /api/catalog/settings/:category/:type` query.
 * Repeated-param style is unused here (no array fields), kept consistent
 * with `buildCatalogSearchParams` skip rules: undefined / '' / non-finite.
 */
export function buildSettingsListSearchParams(
  query: DictionarySettingsListQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  if (typeof query.page === 'number' && Number.isFinite(query.page)) {
    params.append('page', String(query.page));
  }
  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    params.append('limit', String(query.limit));
  }
  if (typeof query.search === 'string' && query.search !== '') {
    params.append('search', query.search);
  }
  if (typeof query.parentId === 'string' && query.parentId !== '') {
    params.append('parentId', query.parentId);
  }

  return params;
}
