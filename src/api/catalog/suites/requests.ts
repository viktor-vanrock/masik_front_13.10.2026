import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import type {
  BenchmarkSuite,
  BenchmarkSuiteOption,
  CreateBenchmarkSuiteDto,
  UpdateBenchmarkSuiteDto,
} from '@/types';
import type { SuitesListQuery } from '../queryKeys';
import {
  resolveBenchmarkDeletion,
  resolveBenchmarkMutation,
  type BenchmarkOperationReceipt,
} from '../operations';

export interface SuitesListResponse {
  data: BenchmarkSuite[];
  total: number;
}

function buildParams(query: SuitesListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.append('search', query.search);
  if (typeof query.page === 'number' && Number.isFinite(query.page)) {
    params.append('page', String(query.page));
  }
  if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
    params.append('limit', String(query.limit));
  }
  return params;
}

export async function listSuites(query: SuitesListQuery): Promise<SuitesListResponse> {
  const { data } = await httpClient.get<SuitesListResponse>(BACKEND_PATHS.catalog.suites.list, {
    params: buildParams(query),
  });
  return data;
}

export async function getSuiteOptions(): Promise<BenchmarkSuiteOption[]> {
  const { data } = await httpClient.get<BenchmarkSuiteOption[]>(
    BACKEND_PATHS.catalog.suites.options,
  );
  return data;
}

export async function getSuite(id: string): Promise<BenchmarkSuite> {
  const { data } = await httpClient.get<BenchmarkSuite>(BACKEND_PATHS.catalog.suites.detail(id));
  return data;
}

export async function createSuite(dto: CreateBenchmarkSuiteDto): Promise<BenchmarkSuite> {
  const { data } = await httpClient.post<BenchmarkSuite | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.suites.list,
    dto,
  );
  return resolveBenchmarkMutation(data, getSuite);
}

export async function updateSuite(
  id: string,
  patch: UpdateBenchmarkSuiteDto,
): Promise<BenchmarkSuite> {
  const { data } = await httpClient.patch<BenchmarkSuite | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.suites.detail(id),
    patch,
  );
  return resolveBenchmarkMutation(data, getSuite);
}

export async function deleteSuite(id: string): Promise<void> {
  const { data } = await httpClient.delete<void | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.suites.detail(id),
  );
  await resolveBenchmarkDeletion(data);
}

export async function restoreSuite(id: string): Promise<BenchmarkSuite> {
  const { data } = await httpClient.post<BenchmarkSuite | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.suites.restore(id),
  );
  return resolveBenchmarkMutation(data, getSuite);
}
