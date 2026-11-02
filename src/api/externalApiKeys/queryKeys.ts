export const EXTERNAL_API_KEYS_QUERY_KEYS = {
  all: ['external-api-keys'] as const,
  list: () => [...EXTERNAL_API_KEYS_QUERY_KEYS.all, 'list'] as const,
  scopes: () => [...EXTERNAL_API_KEYS_QUERY_KEYS.all, 'scopes'] as const,
};
