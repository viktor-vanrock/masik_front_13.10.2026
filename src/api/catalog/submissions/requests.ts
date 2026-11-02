import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';
import type {
  BenchmarkTestListResponse,
  BenchmarkType,
  CatalogSubmissionListQuery,
  ModerateCatalogEntryDto,
  SubmitCatalogEntryDto,
} from '@/types';
import {
  resolveBenchmarkMutation,
  type BenchmarkOperationReceipt,
} from '../operations';

function buildSubmissionParams(
  query: CatalogSubmissionListQuery,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of ['search', 'sortDirection', 'status'] as const) {
    const value = query[key];
    if (value) params.append(key, value);
  }
  for (const key of ['page', 'limit'] as const) {
    const value = query[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      params.append(key, String(value));
    }
  }

  return params;
}

export async function submitCatalogEntry(
  dto: SubmitCatalogEntryDto,
): Promise<BenchmarkType> {
  const { data } = await httpClient.post<BenchmarkType | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.submissions.create,
    dto,
  );
  return resolveBenchmarkMutation(data, getMyCatalogSubmission);
}

export async function listMyCatalogSubmissions(
  query: CatalogSubmissionListQuery,
): Promise<BenchmarkTestListResponse> {
  const { data } = await httpClient.get<BenchmarkTestListResponse>(
    BACKEND_PATHS.catalog.submissions.mine,
    { params: buildSubmissionParams(query) },
  );
  return data;
}

export async function getMyCatalogSubmission(
  id: string,
): Promise<BenchmarkType> {
  const { data } = await httpClient.get<BenchmarkType>(
    BACKEND_PATHS.catalog.submissions.detail(id),
  );
  return data;
}

export async function restoreMyCatalogSubmission(
  id: string,
): Promise<BenchmarkType> {
  const { data } = await httpClient.post<BenchmarkType | BenchmarkOperationReceipt>(
    BACKEND_PATHS.catalog.submissions.restore(id),
  );
  return resolveBenchmarkMutation(data, getMyCatalogSubmission);
}

export async function moderateCatalogEntry(
  id: string,
  decision: ModerateCatalogEntryDto,
): Promise<BenchmarkType> {
  const { data } = await httpClient.patch<BenchmarkType>(
    BACKEND_PATHS.catalog.moderation(id),
    decision,
  );
  return data;
}
