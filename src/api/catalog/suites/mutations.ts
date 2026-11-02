import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import { createSuite, updateSuite, deleteSuite, restoreSuite } from './requests';
import type {
  BenchmarkSuite,
  CreateBenchmarkSuiteDto,
  UpdateBenchmarkSuiteDto,
} from '@/types';

export interface UpdateSuiteVariables {
  id: string;
  patch: UpdateBenchmarkSuiteDto;
}

/** Инвалидирует всё, что зависит от категорий (списки suite, опции, плоский каталог, groups). */
function invalidateSuiteRelated(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.suiteLists() });
  qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.suiteOptions() });
  qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
  qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
}

export function useCreateSuiteMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkSuite, Error, CreateBenchmarkSuiteDto>({
    mutationFn: createSuite,
    retry: 0,
    onSuccess: (created) => {
      invalidateSuiteRelated(qc);
      qc.setQueryData(CATALOG_QUERY_KEYS.suiteDetail(created.id), created);
    },
  });
}

export function useUpdateSuiteMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkSuite, Error, UpdateSuiteVariables>({
    mutationFn: ({ id, patch }) => updateSuite(id, patch),
    retry: 0,
    onSuccess: (updated, { id }) => {
      invalidateSuiteRelated(qc);
      qc.setQueryData(CATALOG_QUERY_KEYS.suiteDetail(id), updated);
    },
  });
}

/** SuperUser only (UI гейтит кнопку отдельно). 409 при не-пустой категории. */
export function useDeleteSuiteMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteSuite,
    retry: 0,
    onSuccess: (_, id) => {
      invalidateSuiteRelated(qc);
      qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.suiteDetail(id) });
    },
  });
}

export function useRestoreSuiteMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkSuite, Error, string>({
    mutationFn: restoreSuite,
    retry: 0,
    onSuccess: (restored) => {
      invalidateSuiteRelated(qc);
      qc.setQueryData(CATALOG_QUERY_KEYS.suiteDetail(restored.id), restored);
    },
  });
}
