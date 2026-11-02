import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, parsePath, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/context/auth/AuthProvider';
import { AppProvider } from '@/context/AppProvider';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { useApp } from '@/hooks/useApp';
import { mockUser } from '@/test/mocks/user';
import { ApiException } from '@/services/http';
import { translations } from '@/i18n';
import { Login } from './index';
import { Register } from '../Register';
import * as authApi from '@/api/auth/authApi';
import * as usersApi from '@/api/users/usersApi';

function Destination() {
  const { canAddBenchmark } = useApp();
  const location = useLocation();
  return <><h1>Submission form</h1><output>{location.pathname + location.search + location.hash}</output><p>{canAddBenchmark ? 'Submission allowed' : 'Submission denied'}</p></>;
}
function renderLogin(route: string, state?: unknown) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return { client, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[{ ...parsePath(route), state }]}>
    <AuthProvider><AppProvider><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AuthGuard />}>
        <Route path="/add-benchmark" element={<Destination />} />
        <Route path="/create" element={<Destination />} />
      </Route>
      <Route path="/" element={<h1>Home catalogue</h1>} />
    </Routes></AppProvider></AuthProvider>
  </MemoryRouter></QueryClientProvider>) };
}

beforeEach(() => localStorage.setItem('gab-lang', 'ru'));
afterEach(() => vi.restoreAllMocks());

describe('actual Login page post-auth redirect', () => {
  it('keeps a guest-to-USER login on the originally requested submission form', async () => {
    let authenticated = false;
    vi.spyOn(usersApi, 'getProfile').mockImplementation(async () => {
      if (!authenticated) throw new ApiException({ statusCode: 401, message: 'Unauthorized' });
      return mockUser({ role: 'USER' });
    });
    vi.spyOn(authApi, 'login').mockImplementation(async () => { authenticated = true; return { success: true }; });
    const view = renderLogin('/add-benchmark');
    await screen.findByRole('button', { name: translations.ru.auth.submit });
    fireEvent.change(view.container.querySelector('input[name="username"]')!, { target: { value: 'alice' } });
    fireEvent.change(view.container.querySelector('input[name="password"]')!, { target: { value: 'Synthetic-2026!' } });
    fireEvent.click(screen.getByRole('button', { name: translations.ru.auth.submit }));
    await screen.findByRole('heading', { name: 'Submission form' });
    // Flush query notifications and both competing navigation effects; a
    // transient visit to /add-benchmark does not establish the final location.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    expect(screen.getByRole('heading', { name: 'Submission form' })).toBeInTheDocument();
    expect(screen.getByText('Submission allowed')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Home catalogue' })).not.toBeInTheDocument();
  });

  it('sends an already logged-in direct /login visit to home', async () => {
    vi.spyOn(usersApi, 'getProfile').mockResolvedValue(mockUser({ role: 'USER' }));
    renderLogin('/login');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Home catalogue' })).toBeInTheDocument());
  });

  it('keeps the guarded create query and hash through Login → Register → Login and successful login', async () => {
    let authenticated = false;
    vi.spyOn(usersApi, 'getProfile').mockImplementation(async () => {
      if (!authenticated) throw new ApiException({ statusCode: 401, message: 'Unauthorized' });
      return mockUser();
    });
    vi.spyOn(authApi, 'login').mockImplementation(async () => { authenticated = true; return { success: true }; });
    const target = '/create?mode=create&new=550e8400-e29b-41d4-a716-446655440000#chat';
    const view = renderLogin(target);
    fireEvent.click(await screen.findByRole('link', { name: translations.ru.auth.register }));
    fireEvent.click(await screen.findByRole('link', { name: translations.ru.auth.login }));
    fireEvent.change(view.container.querySelector('input[name="username"]')!, { target: { value: 'alice' } });
    fireEvent.change(view.container.querySelector('input[name="password"]')!, { target: { value: 'Synthetic-2026!' } });
    fireEvent.click(screen.getByRole('button', { name: translations.ru.auth.submit }));
    await screen.findByRole('heading', { name: 'Submission form' });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    expect(screen.getByRole('status')).toHaveTextContent(target);
  });

  it('keeps the original create intent when the guest chooses registration', async () => {
    let authenticated = false;
    vi.spyOn(usersApi, 'getProfile').mockImplementation(async () => {
      if (!authenticated) throw new ApiException({ statusCode: 401, message: 'Unauthorized' });
      return mockUser();
    });
    const register = vi.spyOn(authApi, 'register').mockImplementation(async () => { authenticated = true; return { success: true }; });
    const target = '/create?mode=modify&base=suite%2Fid&baseType=suite&new=entry-uuid#chat';
    const view = renderLogin(target);
    fireEvent.click(await screen.findByRole('link', { name: translations.ru.auth.register }));
    for (const [name, value] of Object.entries({ username: 'alice', email: 'alice@example.test', password: 'Synthetic-2026!', confirmPassword: 'Synthetic-2026!' })) {
      fireEvent.change(view.container.querySelector(`input[name="${name}"]`)!, { target: { value } });
    }
    fireEvent.click(screen.getByRole('button', { name: translations.ru.auth.register }));
    await screen.findByRole('heading', { name: 'Submission form' });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    expect(register).toHaveBeenCalledWith({ username: 'alice', email: 'alice@example.test', password: 'Synthetic-2026!' });
    expect(screen.getByRole('status')).toHaveTextContent(target);
  });

  it.each(['/login', '/register'])('returns an existing session from %s to its full safe destination', async route => {
    vi.spyOn(usersApi, 'getProfile').mockResolvedValue(mockUser());
    const from = { pathname: '/create', search: '?mode=create&new=entry-uuid', hash: '#chat' };
    renderLogin(route, { from });
    await screen.findByRole('heading', { name: 'Submission form' });
    expect(screen.getByRole('status')).toHaveTextContent(from.pathname + from.search + from.hash);
  });
});


describe('login purges the previous account query cache', () => {
  it('rejects old fetchQuery consumers and ignores a late response after removal', async () => {
    let authenticated = false;
    vi.spyOn(usersApi, 'getProfile').mockImplementation(async () => {
      if (!authenticated) throw new ApiException({ statusCode: 401, message: 'Unauthorized' });
      return mockUser({ role: 'USER', id: 'bob' });
    });
    vi.spyOn(authApi, 'login').mockImplementation(async () => { authenticated = true; return { success: true }; });
    const view = renderLogin('/add-benchmark');
    await screen.findByRole('button', { name: translations.ru.auth.submit });
    let finishOldRequest!: (value: string[]) => void;
    const oldKey = ['conversations', 'list', 'alice'];
    const oldSuccessSetter = vi.fn();
    const pending = view.client.fetchQuery({
      queryKey: oldKey,
      queryFn: () => new Promise<string[]>((resolve) => { finishOldRequest = resolve; }),
    }).then(oldSuccessSetter, () => {});
    fireEvent.change(view.container.querySelector('input[name="username"]')!, { target: { value: 'bob' } });
    fireEvent.change(view.container.querySelector('input[name="password"]')!, { target: { value: 'Synthetic-2026!' } });
    fireEvent.click(screen.getByRole('button', { name: translations.ru.auth.submit }));
    await screen.findByRole('heading', { name: 'Submission form' });
    await pending;
    await act(async () => { finishOldRequest(['alice-private-conversation']); });
    expect(oldSuccessSetter).not.toHaveBeenCalled();
    expect(view.client.getQueryData(oldKey)).toBeUndefined();
  });
});
