/**
 * BACKEND_PATHS — единая мапа всех URL'ов backend-API.
 *
 * Доменный словарь:
 *  - Benchmark      = suite/category (контейнер). URL: /benchmarks/*
 *  - BenchmarkTest  = карточка теста внутри suite. URL: /benchmark-tests/*
 *  - Catalog        = read-model «сгруппированный каталог». URL: /catalog
 *  - Settings       = admin CRUD словарей + public aggregate. URL: /catalog/settings/*
 */
import type { DictionaryCategory, DictionaryType } from '@/types';

export const BACKEND_PATHS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },
  users: {
    profile: '/users/profile',
    list: '/users',
    detail: (id: string) => `/users/${encodeURIComponent(id)}`,
  },
  benchmarkOperations: {
    detail: (id: string) =>
      `/benchmark-operations/${encodeURIComponent(id)}`,
  },
  externalApiKeys: {
    list: '/external-api/api-keys',
    scopes: '/external-api/api-keys/scopes',
    detail: (id: string) => `/external-api/api-keys/${encodeURIComponent(id)}`,
  },
  catalog: {
    list: '/benchmark-tests',
    detail: (id: string) => `/benchmark-tests/${encodeURIComponent(id)}`,
    management: {
      list: '/benchmark-tests/management',
      detail: (id: string) =>
        `/benchmark-tests/management/${encodeURIComponent(id)}`,
    },
    restore: (id: string) => `/benchmark-tests/${encodeURIComponent(id)}/restore`,
    filterOptions: '/benchmark-tests/filters/options',
    benchmarkGroups: '/catalog',
    submissions: {
      create: '/catalog/submissions',
      mine: '/catalog/submissions/mine',
      detail: (id: string) =>
        `/catalog/submissions/${encodeURIComponent(id)}`,
      restore: (id: string) =>
        `/catalog/submissions/${encodeURIComponent(id)}/restore`,
    },
    moderation: (id: string) =>
      `/catalog/entries/${encodeURIComponent(id)}/moderation`,
    suites: {
      list: '/benchmarks',
      options: '/benchmarks/options',
      detail: (id: string) => `/benchmarks/${encodeURIComponent(id)}`,
      restore: (id: string) => `/benchmarks/${encodeURIComponent(id)}/restore`,
    },
  },
  metrics: {
    definitions: '/metrics',
    models: '/metrics/models',
    results: '/metrics/results',
    testResults: (testId: string) =>
      `/metrics/tests/${encodeURIComponent(testId)}/results`,
  },
  leaderboardBoards: {
    create: '/leaderboard-boards',
    list: '/leaderboard-boards/mine',
    public: '/leaderboard-boards/public',
    detail: (id: string) => `/leaderboard-boards/${encodeURIComponent(id)}`,
  },
  settings: {
    aggregate: '/catalog/settings',
    list: (category: DictionaryCategory, type: DictionaryType) =>
      `/catalog/settings/${encodeURIComponent(category)}/${encodeURIComponent(type)}`,
    detail: (category: DictionaryCategory, type: DictionaryType, id: string) =>
      `/catalog/settings/${encodeURIComponent(category)}/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
  },
  conversations: {
    list: '/conversations',
    sidebar: '/conversations/sidebar',
    archive: '/conversations/sidebar/archive',
    detail: (id: string) => `/conversations/${encodeURIComponent(id)}`,
    generation: (id: string) => `/conversations/${encodeURIComponent(id)}/generation`,
    retryGeneration: (id: string) => `/conversations/${encodeURIComponent(id)}/generation/retry`,
    cancelGeneration: (id: string, jobId: string) => `/conversations/${encodeURIComponent(id)}/generation/${encodeURIComponent(jobId)}/cancel`,
    production: (id: string) => `/conversations/${encodeURIComponent(id)}/production`,
  },
  contactRequests: {
    create: '/contact-requests',
  },
  analytics: {
    overview: '/analytics/overview',
    benchmarkViews: '/analytics/benchmarks/views',
    benchmarkTestViews: '/analytics/benchmark-tests/views',
    events: '/analytics/events',
    trackBenchmarkView: '/analytics/benchmark-views',
    trackCatalogEvent: '/analytics/catalog-events',
  },
  socket: {
    path: '/api/socket.io',
  },
} as const;
