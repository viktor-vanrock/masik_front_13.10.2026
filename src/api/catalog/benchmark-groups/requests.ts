import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import { buildCatalogSearchParams } from '../buildCatalogSearchParams';
import type { BenchmarkGroupsResponse, BenchmarkTestListQuery } from '@/types';

export async function getBenchmarkGroups(
  query: BenchmarkTestListQuery,
): Promise<BenchmarkGroupsResponse> {
  const params = buildCatalogSearchParams(query);
  const { data } = await httpClient.get<BenchmarkGroupsResponse>(
    BACKEND_PATHS.catalog.benchmarkGroups,
    { params },
  );
  return data;
}
