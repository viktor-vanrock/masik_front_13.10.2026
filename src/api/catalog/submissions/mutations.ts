import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_QUERY_KEYS } from '../queryKeys';
import {
  moderateCatalogEntry,
  restoreMyCatalogSubmission,
  submitCatalogEntry,
} from './requests';
import type {
  BenchmarkType,
  ModerateCatalogEntryDto,
  SubmitCatalogEntryDto,
} from '@/types';

export function useSubmitCatalogEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation<BenchmarkType, Error, SubmitCatalogEntryDto>({
    mutationFn: submitCatalogEntry,
    retry: 0,
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.mySubmissionLists(),
      });
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.managementLists(),
      });
      queryClient.setQueryData(
        CATALOG_QUERY_KEYS.mySubmissionDetail(created.id),
        created,
      );
      queryClient.removeQueries({
        queryKey: CATALOG_QUERY_KEYS.detail(created.id),
      });
    },
  });
}

export function useRestoreMyCatalogSubmissionMutation() {
  const queryClient = useQueryClient();

  return useMutation<BenchmarkType, Error, string>({
    mutationFn: restoreMyCatalogSubmission,
    retry: 0,
    onSuccess: (restored) => {
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.mySubmissionLists(),
      });
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.managementLists(),
      });
      queryClient.setQueryData(
        CATALOG_QUERY_KEYS.mySubmissionDetail(restored.id),
        restored,
      );
    },
  });
}

export interface ModerateCatalogEntryVariables {
  id: string;
  decision: ModerateCatalogEntryDto;
}

export function useModerateCatalogEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation<BenchmarkType, Error, ModerateCatalogEntryVariables>({
    mutationFn: ({ id, decision }) => moderateCatalogEntry(id, decision),
    retry: 0,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.managementLists(),
      });
      queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.groups() });
      queryClient.invalidateQueries({
        queryKey: CATALOG_QUERY_KEYS.mySubmissionLists(),
      });
      queryClient.setQueryData(
        CATALOG_QUERY_KEYS.managementDetail(updated.id),
        updated,
      );
      if (updated.validationStatus === 'published') {
        queryClient.setQueryData(CATALOG_QUERY_KEYS.detail(updated.id), updated);
      } else {
        queryClient.removeQueries({
          queryKey: CATALOG_QUERY_KEYS.detail(updated.id),
        });
      }
    },
  });
}
