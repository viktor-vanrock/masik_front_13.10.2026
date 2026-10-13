import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { mockUser } from '@/test/mocks/user';
import { ApiException } from '@/services/http';

vi.mock('@/api/users', async (original) => ({
  ...await original<typeof import('@/api/users')>(),
  useProfile: () => ({ data: undefined, error: new ApiException({ statusCode: 401, message: 'Unauthorized' }), isError: true }),
  getProfile: vi.fn(async () => mockUser({ role: 'USER' })),
}));
vi.mock('@/api/auth', () => ({
  useLoginMutation: () => ({ mutateAsync: vi.fn(async () => ({ success: true })), isPending: false, error: null }),
  useRegisterMutation: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
  useLogoutMutation: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
}));

function LoginProbe() {
  const { login } = useAuth();
  const location = useLocation();
  return <><button onClick={() => void login({ username: 'user', password: 'test' })}>Log in</button><output>{location.pathname}</output></>;
}

describe('AuthProvider post-login destination', () => {
  it.each([
    ['/add-benchmark', '/add-benchmark'],
    ['/admin', '/'],
  ])('returns USER from %s to %s', async (from, target) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[
      { pathname: '/login', state: { from: { pathname: from } } },
    ]}><AuthProvider><LoginProbe /></AuthProvider></MemoryRouter></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(target));
    expect(screen.getByRole('status').textContent).toBe(target);
  });
});
