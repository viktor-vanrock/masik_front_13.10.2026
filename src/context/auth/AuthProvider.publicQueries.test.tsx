import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBenchmarkGroupsQuery } from '@/api/catalog/benchmark-groups/queries';
import * as groupsApi from '@/api/catalog/benchmark-groups/requests';
import * as usersApi from '@/api/users/usersApi';
import * as authApi from '@/api/auth/authApi';
import { CATALOG_QUERY_KEYS } from '@/api/catalog/queryKeys';
import { SETTINGS_QUERY_KEYS } from '@/api/settings/queryKeys';
import { METRICS_QUERY_KEYS } from '@/api/metrics/queryKeys';
import { USERS_QUERY_KEYS } from '@/api/users/queryKeys';
import * as auth from '@/services/auth';
import { ApiException } from '@/services/http';
import { mockUser } from '@/test/mocks/user';
import type { BenchmarkGroupsResponse, User } from '@/types';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const publicGroups: BenchmarkGroupsResponse = {
  data: [{
    benchmark: {
      id: 'public-suite', name: 'Public suite', nameEn: 'Public suite',
      description: null, descriptionEn: null, benchmarkTestsCount: 0, matchedTestsCount: 0,
    },
    tests: [],
  }],
  total: 1,
};

function CatalogueProbe() {
  const { status, logout } = useAuth();
  const groups = useBenchmarkGroupsQuery({});
  return <>
    <output>{status}</output>
    <p>{groups.isPending ? 'Loading catalogue' : groups.data?.pages[0].data[0]?.benchmark.name}</p>
    <button onClick={() => void logout()}>Log out</button>
  </>;
}

let notifySessionChanged: () => void;
beforeEach(() => {
  vi.spyOn(auth, 'subscribeAuthSessionChange').mockImplementation((handler) => {
    notifySessionChanged = handler;
    return () => {};
  });
  vi.spyOn(auth, 'broadcastAuthSessionChanged').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

function renderCatalogue(client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})) {
  return { client, ...render(
    <QueryClientProvider client={client}><MemoryRouter>
      <AuthProvider><CatalogueProbe /></AuthProvider>
    </MemoryRouter></QueryClientProvider>,
  ) };
}

const privateKeys = [
  CATALOG_QUERY_KEYS.managementList({}),
  CATALOG_QUERY_KEYS.managementDetail('private-test'),
  CATALOG_QUERY_KEYS.mySubmissionList({}),
  CATALOG_QUERY_KEYS.mySubmissionDetail('private-test'),
  SETTINGS_QUERY_KEYS.list({ category: 'taxonomy', type: 'macro-groups' }),
  METRICS_QUERY_KEYS.definitionList({}),
  ['conversations', 'list', 'alice'],
  ['admin-users'], ['external-api-keys'], ['analytics'], ['unknown-future-query'],
];
const publicKeys = [
  CATALOG_QUERY_KEYS.list({}), CATALOG_QUERY_KEYS.detail('public-test'),
  CATALOG_QUERY_KEYS.filterOptions(), CATALOG_QUERY_KEYS.suiteList({}),
  CATALOG_QUERY_KEYS.suiteDetail('public-suite'), CATALOG_QUERY_KEYS.suiteOptions(),
  SETTINGS_QUERY_KEYS.aggregate(), METRICS_QUERY_KEYS.models(),
  METRICS_QUERY_KEYS.testResults('public-test', {}),
];

describe('public catalogue observers at session boundaries', () => {
  it.each(['profile first', 'catalogue first'])(
    'keeps the mounted public query usable after bootstrap 401 (%s)',
    async (order) => {
      const profile = deferred<User>();
      const groups = deferred<BenchmarkGroupsResponse>();
      vi.spyOn(usersApi, 'getProfile').mockReturnValue(profile.promise);
      const request = vi.spyOn(groupsApi, 'getBenchmarkGroups').mockReturnValue(groups.promise);
      const { client } = renderCatalogue();
      await waitFor(() => expect(request).toHaveBeenCalledOnce());
      const publicQuery = client.getQueryCache().find({ queryKey: CATALOG_QUERY_KEYS.group({}) });
      if (order === 'catalogue first') {
        await act(async () => groups.resolve(publicGroups));
        await screen.findByText('Public suite');
      }
      await act(async () => profile.reject(new ApiException({ statusCode: 401, message: 'Unauthorized' })));
      await screen.findByText('anonymous');
      if (order === 'profile first') await act(async () => groups.resolve(publicGroups));
      await screen.findByText('Public suite');
      expect(client.getQueryCache().find({ queryKey: CATALOG_QUERY_KEYS.group({}) })).toBe(publicQuery);
      expect(request).toHaveBeenCalledOnce();
    },
  );

  it('loads with an existing logout barrier and removes only private cached data', async () => {
    auth.markLocalLogout();
    const profile = vi.spyOn(usersApi, 'getProfile');
    vi.spyOn(groupsApi, 'getBenchmarkGroups').mockResolvedValue(publicGroups);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    for (const key of [...publicKeys, ...privateKeys]) client.setQueryData(key, 'cached');
    sessionStorage.setItem(auth.CONV_SESSION_KEY, 'alice-private-conversation');
    localStorage.setItem(auth.CONV_NAMES_KEY, 'alice-private-names');
    renderCatalogue(client);
    await screen.findByText('Public suite');
    expect(profile).not.toHaveBeenCalled();
    for (const key of publicKeys) expect(client.getQueryData(key)).toBe('cached');
    for (const key of privateKeys) expect(client.getQueryData(key)).toBeUndefined();
    expect(sessionStorage.getItem(auth.CONV_SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(auth.CONV_NAMES_KEY)).toBeNull();
  });

  it.each(['own-tab logout', 'cross-tab logout', 'cross-tab login', 'identity change'])(
    'preserves a pending public request and cancels private late fetches on %s',
    async (boundary) => {
      vi.spyOn(usersApi, 'getProfile').mockResolvedValue(mockUser({ id: 'alice' }));
      vi.spyOn(authApi, 'logout').mockResolvedValue({ success: true });
      const groups = deferred<BenchmarkGroupsResponse>();
      const request = vi.spyOn(groupsApi, 'getBenchmarkGroups').mockReturnValue(groups.promise);
      const { client } = renderCatalogue();
      await screen.findByText('authenticated');
      const publicQuery = client.getQueryCache().find({ queryKey: CATALOG_QUERY_KEYS.group({}) });
      const privateResponse = deferred<string>();
      const receivePrivate = vi.fn();
      const privateKey = ['conversations', 'list', 'alice'];
      const pending = client.fetchQuery({ queryKey: privateKey, queryFn: () => privateResponse.promise })
        .then(receivePrivate, () => {});
      client.getMutationCache().build(client, { mutationKey: ['private-mutation'] });
      if (boundary === 'own-tab logout') {
        fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
        await screen.findByText('anonymous');
      } else if (boundary === 'cross-tab logout') {
        await act(async () => { auth.markLocalLogout(); notifySessionChanged(); });
        await screen.findByText('anonymous');
      } else if (boundary === 'cross-tab login') {
        vi.mocked(usersApi.getProfile).mockResolvedValue(mockUser({ id: 'bob' }));
        await act(async () => notifySessionChanged());
        await waitFor(() => expect(client.getQueryData<User>(USERS_QUERY_KEYS.profile)?.id).toBe('bob'));
      } else {
        await act(async () => client.setQueryData(USERS_QUERY_KEYS.profile, mockUser({ id: 'bob' })));
        await waitFor(() => expect(client.getQueryState(privateKey)).toBeUndefined());
      }
      await pending;
      await act(async () => { privateResponse.resolve('alice-secret'); groups.resolve(publicGroups); });
      await screen.findByText('Public suite');
      expect(client.getQueryCache().find({ queryKey: CATALOG_QUERY_KEYS.group({}) })).toBe(publicQuery);
      expect(request).toHaveBeenCalledOnce();
      expect(receivePrivate).not.toHaveBeenCalled();
      expect(client.getQueryData(privateKey)).toBeUndefined();
      if (boundary.endsWith('logout')) {
        expect(client.getQueryData(USERS_QUERY_KEYS.profile)).toBeUndefined();
        expect(client.getMutationCache().getAll()).toHaveLength(0);
      }
    },
  );
});
