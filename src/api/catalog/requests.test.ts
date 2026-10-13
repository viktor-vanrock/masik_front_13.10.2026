import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import { BenchmarkSortColumn, SortDirection } from '@/types';
import { getBenchmarkGroups } from './benchmark-groups/requests';
import {
  createBenchmark,
  deleteBenchmark,
  getBenchmark,
  getBenchmarkForManagement,
  listBenchmarks,
  listBenchmarksForManagement,
  restoreBenchmark,
  updateBenchmark,
} from './benchmarks/requests';
import { getFilterOptions } from './filter-options/requests';
import {
  getMyCatalogSubmission,
  listMyCatalogSubmissions,
  moderateCatalogEntry,
  restoreMyCatalogSubmission,
  submitCatalogEntry,
} from './submissions/requests';
import {
  createSuite,
  deleteSuite,
  getSuite,
  getSuiteOptions,
  listSuites,
  restoreSuite,
  updateSuite,
} from './suites/requests';

describe('catalog API requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses protected management endpoints without changing query serialization', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { data: [], total: 0 } } as never);
    const query = { search: 'pending', page: 2, limit: 25 };

    await listBenchmarksForManagement(query);
    await getBenchmarkForManagement('test/id');

    expect(get.mock.calls[0]?.[0]).toBe('/benchmark-tests/management');
    expect(
      (get.mock.calls[0]?.[1]?.params as URLSearchParams).toString(),
    ).toBe('search=pending&page=2&limit=25');
    expect(get.mock.calls[1]?.[0]).toBe(
      '/benchmark-tests/management/test%2Fid',
    );
  });

  it('uses the same serialized query for flat and grouped catalog reads', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { data: [], total: 0 } } as never);
    const query = {
      search: 'qa',
      page: 3,
      limit: 20,
      sortColumn: BenchmarkSortColumn.Name,
      sortDirection: SortDirection.Desc,
      domainIds: ['domain-1', 'domain-2'],
    };

    await listBenchmarks(query);
    await getBenchmarkGroups(query);

    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[0]?.[0]).toBe('/benchmark-tests');
    expect(get.mock.calls[1]?.[0]).toBe('/catalog');
    const flatParams = get.mock.calls[0]?.[1]?.params as URLSearchParams;
    const groupedParams = get.mock.calls[1]?.[1]?.params as URLSearchParams;
    expect(flatParams.toString()).toBe(groupedParams.toString());
    expect(flatParams.getAll('domainIds')).toEqual(['domain-1', 'domain-2']);
    expect(flatParams.get('sortDirection')).toBe('DESC');
  });

  it('encodes Test IDs and keeps write payloads unchanged', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { id: 'test' } } as never);
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: { id: 'test' } } as never);
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue({ data: { id: 'test' } } as never);
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue({} as never);
    const createDto = {
      suiteId: 'suite-id',
      name: 'Test',
      nameEn: 'Test EN',
      description: 'Description',
      domainIds: ['domain-id'],
    };
    const updateDto = { description: 'Updated' };

    await getBenchmark('test/id');
    await createBenchmark(createDto);
    await updateBenchmark('test/id', updateDto);
    await deleteBenchmark('test/id');
    await restoreBenchmark('test/id');

    expect(get).toHaveBeenCalledWith('/benchmark-tests/test%2Fid');
    expect(post).toHaveBeenNthCalledWith(1, '/benchmark-tests', createDto);
    expect(patch).toHaveBeenCalledWith('/benchmark-tests/test%2Fid', updateDto);
    expect(remove).toHaveBeenCalledWith('/benchmark-tests/test%2Fid');
    expect(post).toHaveBeenNthCalledWith(2, '/benchmark-tests/test%2Fid/restore');
  });

  it('uses the filter-options endpoint without injecting client-side defaults', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: {} } as never);

    await getFilterOptions();

    expect(get).toHaveBeenCalledWith('/benchmark-tests/filters/options');
  });

  it('uses the dedicated author and moderation contract for catalog submissions', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { data: [], total: 0 } } as never);
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ data: { id: 'test' } } as never);
    const patch = vi
      .spyOn(httpClient, 'patch')
      .mockResolvedValue({ data: { id: 'test' } } as never);
    const submission = {
      suiteId: 'suite-id',
      name: 'Test',
      nameEn: 'Test EN',
      description: 'Description',
    };

    await submitCatalogEntry(submission);
    await listMyCatalogSubmissions({
      page: 2,
      limit: 25,
      status: 'rejected',
    });
    await getMyCatalogSubmission('test/id');
    await restoreMyCatalogSubmission('test/id');
    await moderateCatalogEntry('test/id', {
      status: 'rejected',
      rejectionReason: 'Needs work',
    });

    expect(post).toHaveBeenNthCalledWith(1, '/catalog/submissions', submission);
    expect(get.mock.calls[0]?.[0]).toBe('/catalog/submissions/mine');
    expect(
      (get.mock.calls[0]?.[1]?.params as URLSearchParams).toString(),
    ).toBe('status=rejected&page=2&limit=25');
    expect(get).toHaveBeenNthCalledWith(2, '/catalog/submissions/test%2Fid');
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/catalog/submissions/test%2Fid/restore',
    );
    expect(patch).toHaveBeenCalledWith(
      '/catalog/entries/test%2Fid/moderation',
      { status: 'rejected', rejectionReason: 'Needs work' },
    );
  });

  it('serializes suite list values and omits invalid optional query values', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ data: { data: [], total: 0 } } as never);

    await listSuites({ search: 'suite', page: 2, limit: Number.NaN });

    const params = get.mock.calls[0]?.[1]?.params as URLSearchParams;
    expect(get.mock.calls[0]?.[0]).toBe('/benchmarks');
    expect(params.toString()).toBe('search=suite&page=2');
  });

  it('encodes suite IDs for every detail and mutation endpoint', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: {} } as never);
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: {} } as never);
    const patch = vi.spyOn(httpClient, 'patch').mockResolvedValue({ data: {} } as never);
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue({} as never);
    const createDto = { name: 'Suite', nameEn: 'Suite EN' };
    const updateDto = { description: 'Updated' };

    await getSuiteOptions();
    await getSuite('suite/id');
    await createSuite(createDto);
    await updateSuite('suite/id', updateDto);
    await deleteSuite('suite/id');
    await restoreSuite('suite/id');

    expect(get).toHaveBeenNthCalledWith(1, '/benchmarks/options');
    expect(get).toHaveBeenNthCalledWith(2, '/benchmarks/suite%2Fid');
    expect(post).toHaveBeenNthCalledWith(1, '/benchmarks', createDto);
    expect(patch).toHaveBeenCalledWith('/benchmarks/suite%2Fid', updateDto);
    expect(remove).toHaveBeenCalledWith('/benchmarks/suite%2Fid');
    expect(post).toHaveBeenNthCalledWith(2, '/benchmarks/suite%2Fid/restore');
  });

  it('waits for an accepted Suite command and reloads its projection', async () => {
    const operationId = 'operation-id';
    const suiteId = 'suite-id';
    const receipt = {
      operationId,
      aggregateId: suiteId,
      aggregateType: 'benchmark',
      status: 'queued',
      statusUrl: `/api/benchmark-operations/${operationId}`,
    };
    vi.spyOn(httpClient, 'post').mockResolvedValue({ data: receipt } as never);
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({
        data: {
          commandEventId: operationId,
          aggregateId: suiteId,
          aggregateType: 'benchmark',
          status: 'applied',
        },
      } as never)
      .mockResolvedValueOnce({
        data: { id: suiteId, name: 'Suite', nameEn: 'Suite EN' },
      } as never);

    await expect(
      createSuite({ name: 'Suite', nameEn: 'Suite EN' }),
    ).resolves.toMatchObject({ id: suiteId });
    expect(get).toHaveBeenNthCalledWith(
      1,
      `/benchmark-operations/${operationId}`,
      { signal: expect.any(AbortSignal) },
    );
    expect(get).toHaveBeenNthCalledWith(2, `/benchmarks/${suiteId}`);
  });

  it('waits for an accepted submission and reloads it through the owner API', async () => {
    const operationId = 'operation-id';
    const testId = 'test-id';
    vi.spyOn(httpClient, 'post').mockResolvedValue({
      data: {
        operationId,
        aggregateId: testId,
        aggregateType: 'test',
        status: 'queued',
        statusUrl: `/api/benchmark-operations/${operationId}`,
      },
    } as never);
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({
        data: {
          commandEventId: operationId,
          aggregateId: testId,
          aggregateType: 'test',
          status: 'applied',
        },
      } as never)
      .mockResolvedValueOnce({ data: { id: testId, name: 'Test' } } as never);

    await expect(
      submitCatalogEntry({
        suiteId: 'suite-id',
        name: 'Test',
        nameEn: 'Test EN',
        description: 'Description',
      }),
    ).resolves.toMatchObject({ id: testId });
    expect(get).toHaveBeenNthCalledWith(
      1,
      `/benchmark-operations/${operationId}`,
      { signal: expect.any(AbortSignal) },
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      `/catalog/submissions/${testId}`,
    );
  });
});
