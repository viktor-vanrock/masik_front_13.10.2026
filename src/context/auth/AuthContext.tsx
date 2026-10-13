// Единая точка доступа к auth-состоянию. Статус выводится из GET /api/users/profile:
// initializing (pending) · authenticated (200) · anonymous (401) · error (network/5xx).

import { createContext } from 'react';
import type { LoginDto, RegisterDto, User } from '@/types';

export type AuthStatus = 'initializing' | 'authenticated' | 'anonymous' | 'error';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-run the profile bootstrap (used by the `error` retry UI). */
  retry: () => void;
  canAccess: (pathname: string) => boolean;

  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  loginError: Error | null;
  registerError: Error | null;
  logoutError: Error | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
