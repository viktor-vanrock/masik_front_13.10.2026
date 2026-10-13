import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import type { BenchmarkTestFilterOptions } from '@/types';

export async function getFilterOptions(): Promise<BenchmarkTestFilterOptions> {
  const { data } = await httpClient.get<BenchmarkTestFilterOptions>(
    BACKEND_PATHS.catalog.filterOptions,
  );
  return data;
}
