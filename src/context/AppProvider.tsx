import type { ReactNode } from 'react';
import { useAuth } from './auth';
import { useLang } from '../hooks/useLang';
import { useTheme } from '../hooks/useTheme';
import { isAdminRole } from '../utils/auth/roles';
import { AppContext } from './AppContext';

interface Props {
  children: ReactNode;
}

/**
 * AppProvider — глобальные UI-сервисы + проброс auth-фасада.
 * Должен монтироваться ВНУТРИ AuthProvider (см. App.tsx).
 */
export function AppProvider({ children }: Props) {
  const auth = useAuth();
  const langState = useLang();
  const themeState = useTheme();

  const userRole = auth.user?.role ?? null;
  const isAuthenticated = auth.status === 'authenticated';
  const isAdmin = isAuthenticated && isAdminRole(userRole);
  const canAddBenchmark = isAuthenticated && auth.canAccess('/add-benchmark');

  return (
    <AppContext.Provider
      value={{
        status: auth.status,
        user: auth.user,
        isAuthenticated,
        isAdmin,
        canAddBenchmark,
        userRole,
        login: auth.login,
        register: auth.register,
        logout: auth.logout,
        isLoggingOut: auth.isLoggingOut,
        logoutError: auth.logoutError,
        ...langState,
        ...themeState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
