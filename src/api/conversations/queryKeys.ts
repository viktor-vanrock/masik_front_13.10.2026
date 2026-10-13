export const CONVERSATIONS_QUERY_KEYS = {
  all: ['conversations'] as const,
  lists: () => [...CONVERSATIONS_QUERY_KEYS.all, 'list'] as const,
  list: (userId: string) => [...CONVERSATIONS_QUERY_KEYS.lists(), userId] as const,
  details: () => [...CONVERSATIONS_QUERY_KEYS.all, 'detail'] as const,
  detail: (userId: string, id: string) => [...CONVERSATIONS_QUERY_KEYS.details(), userId, id] as const,
  generation: (userId: string, id: string) => [...CONVERSATIONS_QUERY_KEYS.detail(userId, id), 'generation'] as const,
  production: (userId: string, id: string) => [...CONVERSATIONS_QUERY_KEYS.detail(userId, id), 'production'] as const,
} as const;
