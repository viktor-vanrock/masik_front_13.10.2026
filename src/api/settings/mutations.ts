import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_QUERY_KEYS } from '@/api/catalog/queryKeys';
import { SETTINGS_QUERY_KEYS } from './queryKeys';
import {
  createDictionaryEntry,
  deleteDictionaryEntry,
  updateDictionaryEntry,
} from './requests';
import type {
  CreateDtoFor,
  DictionaryCategory,
  DictionarySettingsEntry,
  DictionaryTypeByCategory,
  UpdateDtoFor,
} from '@/types';

export interface UpdateDictionaryVariables<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
> {
  id: string;
  patch: UpdateDtoFor<C, T>;
}

export function useCreateDictionaryMutation<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
>(pair: { category: C; type: T }) {
  const qc = useQueryClient();
  return useMutation<DictionarySettingsEntry, Error, CreateDtoFor<C, T>>({
    mutationFn: (dto) => createDictionaryEntry(pair, dto),
    retry: 0,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.lists(pair) });
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.aggregate() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.setQueryData(SETTINGS_QUERY_KEYS.detail(pair, created.id), created);
    },
  });
}

export function useUpdateDictionaryMutation<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
>(pair: { category: C; type: T }) {
  const qc = useQueryClient();
  return useMutation<
    DictionarySettingsEntry,
    Error,
    UpdateDictionaryVariables<C, T>
  >({
    mutationFn: ({ id, patch }) => updateDictionaryEntry(pair, id, patch),
    retry: 0,
    onSuccess: (updated, { id }) => {
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.lists(pair) });
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.aggregate() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.setQueryData(SETTINGS_QUERY_KEYS.detail(pair, id), updated);
    },
  });
}

export function useDeleteDictionaryMutation<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
>(pair: { category: C; type: T }) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteDictionaryEntry(pair, id),
    retry: 0,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.lists(pair) });
      qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.aggregate() });
      qc.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.filterOptions() });
      qc.removeQueries({ queryKey: SETTINGS_QUERY_KEYS.detail(pair, id) });
    },
  });
}
