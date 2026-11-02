import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthContext, type AuthContextValue } from './AuthContext';
import type { ReactNode } from 'react';

describe('useAuth', () => {
  it('бросает понятную ошибку вне <AuthProvider>', () => {
    // Без провайдера контекст null → должен бросить.
    expect(() => renderHook(() => useAuth())).toThrow(
      /useAuth must be used within <AuthProvider>/
    );
  });

  it('возвращает значение контекста при наличии провайдера', () => {
    const mockValue: AuthContextValue = {
      status: 'anonymous',
      user: null,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      retry: () => {},
      canAccess: () => true,
      isLoggingIn: false,
      isRegistering: false,
      isLoggingOut: false,
      loginError: null,
      registerError: null,
      logoutError: null,
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(mockValue);
  });
});
