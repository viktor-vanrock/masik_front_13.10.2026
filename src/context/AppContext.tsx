import { createContext } from 'react';

import type { AnyTranslations, Lang } from '../i18n';
import type { LoginDto, RegisterDto, User, UserRole } from '../types';
import type { AuthStatus } from './auth/AuthContext';

/**
 * AppContext — глобальные UI-сервисы приложения (i18n, theme) + проброс
 * auth-фасада для удобства потребителей.
 *
 * Auth-поля делегируются в AuthContext (см. context/auth/AuthProvider). Здесь
 * мы их не вычисляем повторно — единственный источник правды это AuthProvider.
 */
interface AppContextType {
  status: AuthStatus;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canAddBenchmark: boolean;
  userRole: UserRole | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  logoutError: Error | null;

  lang: Lang;
  setLang: (l: Lang) => void;
  t: AnyTranslations;

  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const AppContext = createContext<AppContextType | null>(null);
