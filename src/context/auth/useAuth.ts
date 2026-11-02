/**
 * useAuth — тонкая обёртка над useContext(AuthContext) с проверкой.
 * Использовать только внутри <AuthProvider>.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
