import type { BenchmarkType } from './catalog';

/** Категория (на бэке — `Benchmark`). Контейнер для `BenchmarkType` (карточек). */
export interface BenchmarkSuite {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  benchmarkTestsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type BenchmarkSuiteOption = Pick<BenchmarkSuite, 'id' | 'name' | 'nameEn'>;

export interface CreateBenchmarkSuiteDto {
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
}

export type UpdateBenchmarkSuiteDto = Partial<CreateBenchmarkSuiteDto>;

export interface BenchmarkGroupSuite {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  benchmarkTestsCount: number;
  matchedTestsCount: number;
}

export interface BenchmarkGroup {
  benchmark: BenchmarkGroupSuite;
  tests: BenchmarkType[];
}

export interface BenchmarkGroupsResponse {
  data: BenchmarkGroup[];
  total: number;
}
