import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import {
  createBenchmark,
  updateBenchmark,
  deleteBenchmark,
  restoreBenchmark,
} from './requests';
import type {
  BenchmarkType,
  CreateBenchmarkTestDto,
  UpdateBenchmarkTestDto,
} from '@/types';

export interface UpdateBenchmarkVariables {
  id: string;
  patch: UpdateBenchmarkTestDto;
}

export function useCreateBenchmarkMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkType, Error, CreateBenchmarkTestDto>({
    mutationFn: createBenchmark,
    retry: 0,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.managementLists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.setQueryData(CATALOG_QUERY_KEYS.managementDetail(created.id), created);
      if (created.validationStatus === 'published') {
        qc.setQueryData(CATALOG_QUERY_KEYS.detail(created.id), created);
      } else {
        qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.detail(created.id) });
      }
    },
  });
}

export function useUpdateBenchmarkMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkType, Error, UpdateBenchmarkVariables>({
    mutationFn: ({ id, patch }) => updateBenchmark(id, patch),
    retry: 0,
    onSuccess: (updated, { id }) => {
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.managementLists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.setQueryData(CATALOG_QUERY_KEYS.managementDetail(id), updated);
      if (updated.validationStatus === 'published') {
        qc.setQueryData(CATALOG_QUERY_KEYS.detail(id), updated);
      } else {
        qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.detail(id) });
      }
    },
  });
}

export function useDeleteBenchmarkMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteBenchmark,
    retry: 0,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.managementLists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.detail(id) });
      qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.managementDetail(id) });
    },
  });
}

export function useRestoreBenchmarkMutation() {
  const qc = useQueryClient();
  return useMutation<BenchmarkType, Error, string>({
    mutationFn: restoreBenchmark,
    retry: 0,
    onSuccess: (restored) => {
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.managementLists() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.setQueryData(CATALOG_QUERY_KEYS.managementDetail(restored.id), restored);
      if (restored.validationStatus === 'published') {
        qc.setQueryData(CATALOG_QUERY_KEYS.detail(restored.id), restored);
      } else {
        qc.removeQueries({ queryKey: CATALOG_QUERY_KEYS.detail(restored.id) });
      }
    },
  });
}
