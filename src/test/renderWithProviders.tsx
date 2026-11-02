import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * QueryClient под тесты: без retries (чтобы быстрые тесты),
 * без staleTime/gcTime (чтобы данные не "залипали" между тестами).
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  route: string;
}

function AllProviders({ children, queryClient, route }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

export interface RenderWithProvidersOptions extends Omit<
  RenderOptions,
  "wrapper"
> {
  /** Custom QueryClient instance (например, для проверки query cache). */
  queryClient?: QueryClient;
  /** Начальный route для MemoryRouter, по умолчанию `/`. */
  route?: string;
}

/**
 * Рендер компонента с обёрткой из QueryClient + MemoryRouter.
 *
 * @example
 * renderWithProviders(<Login />, { route: '/login' });
 *
 * @example
 * const qc = createTestQueryClient();
 * qc.setQueryData(USERS_QUERY_KEYS.profile, mockUser());
 * renderWithProviders(<Profile />, { queryClient: qc });
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    route = "/",
    ...rest
  }: RenderWithProvidersOptions = {},
) {
  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders queryClient={queryClient} route={route}>
          {children}
        </AllProviders>
      ),
      ...rest,
    }),
  };
}
