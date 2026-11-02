// Мост к QueryClient для слоёв вне React-дерева (axios interceptor).
// До регистрации getQueryClient() возвращает null. resetQueryClient() — только для тестов.

import type { QueryClient } from '@tanstack/react-query';

let queryClientRef: QueryClient | null = null;

export function setQueryClient(client: QueryClient): void {
  queryClientRef = client;
}

export function getQueryClient(): QueryClient | null {
  return queryClientRef;
}

export function resetQueryClient(): void {
  queryClientRef = null;
}
