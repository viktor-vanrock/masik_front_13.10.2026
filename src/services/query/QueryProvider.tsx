// QueryProvider — один QueryClient на приложение + регистрация его в queryClientRef,
// чтобы HTTP-interceptor мог инвалидировать queries вне React-дерева.

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from './queryClient';
import { setQueryClient } from './queryClientRef';

interface Props {
  children: ReactNode;
  /** Готовый QueryClient для тестов/Storybook; в приложении не передаётся. */
  client?: QueryClient;
}

export function QueryProvider({ children, client }: Props) {
  const [queryClient] = useState(() => client ?? createQueryClient());

  useEffect(() => {
    // Регистрируем инстанс для не-React слоёв (axios interceptor).
    setQueryClient(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
