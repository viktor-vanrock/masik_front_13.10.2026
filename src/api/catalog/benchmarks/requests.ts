import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import { buildCatalogSearchParams } from '../buildCatalogSearchParams';
import type {
  BenchmarkTestListQuery,
  BenchmarkTestListResponse,
  BenchmarkType,
  CreateBenchmarkTestDto,
  UpdateBenchmarkTestDto,
} from '@/types';
import {
  resolveBenchmarkDeletion,
  resolveBenchmarkMutation,
  type BenchmarkOperationReceipt,
} from '../operations';

export async function listBenchmarks(
  query: BenchmarkTestListQuery,
): Promise<BenchmarkTestListResponse> {
  const params = buildCatalogSearchParams(query);
  const { data } = await httpClient.get<BenchmarkTestListResponse>(
    BACKEND_PATHS.catalog.list,
    { params },
  );
  return data;
}

export async function getBenchmark(id: string): Promise<BenchmarkType> {
  const { data } = await httpClient.get<BenchmarkType>(BACKEND_PATHS.catalog.detail(id));
  return data;
}

export async function listBenchmarksForManagement(
  query: BenchmarkTestListQuery,
): Promise<BenchmarkTestListResponse> {
  const params = buildCatalogSearchParams(query);
  const { data } = await httpClient.get<BenchmarkTestListResponse>(
    BACKEND_PATHS.catalog.management.list,
    { params },
  );
  return data;
}

export async function getBenchmarkForManagement(id: string): Promise<BenchmarkType> {
  const { data } = await httpClient.get<BenchmarkType>(
    BACKEND_PATHS.catalog.management.detail(id),
  );
  return data;
}

export async function createBenchmark(dto: CreateBenchmarkTestDto): Promise<BenchmarkType> {
  const { data } = await httpClient.post<BenchmarkType | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.list,
    dto,
  );
  return resolveBenchmarkMutation(data, getBenchmarkForManagement);
}

export async function updateBenchmark(
  id: string,
  patch: UpdateBenchmarkTestDto,
): Promise<BenchmarkType> {
  const { data } = await httpClient.patch<BenchmarkType | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.detail(id),
    patch,
  );
  return resolveBenchmarkMutation(data, getBenchmarkForManagement);
}

export async function deleteBenchmark(id: string): Promise<void> {
  const { data } = await httpClient.delete<void | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.detail(id),
  );
  await resolveBenchmarkDeletion(data);
}

export async function restoreBenchmark(id: string): Promise<BenchmarkType> {
  const { data } = await httpClient.post<BenchmarkType | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.restore(id),
  );
  return resolveBenchmarkMutation(data, getBenchmarkForManagement);
}
