import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { shouldRetry } from '@/services/http';
import { SETTINGS_QUERY_KEYS } from './queryKeys';
import {
  getDictionaryEntry,
  getSettingsAggregate,
  listDictionary,
} from './requests';
import type {
  DictionaryCategory,
  DictionaryPair,
  DictionarySettingsEntry,
  DictionarySettingsListQuery,
  DictionarySettingsListResponse,
  SettingsAggregate,
} from '@/types';

const AGGREGATE_STALE_TIME = 5 * 60_000;
const AGGREGATE_GC_TIME = 30 * 60_000;

export function useSettingsAggregateQuery() {
  return useQuery<SettingsAggregate>({
    queryKey: SETTINGS_QUERY_KEYS.aggregate(),
    queryFn: getSettingsAggregate,
    staleTime: AGGREGATE_STALE_TIME,
    gcTime: AGGREGATE_GC_TIME,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });
}

export function useDictionaryListQuery<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  query: DictionarySettingsListQuery = {},
) {
  return useQuery<DictionarySettingsListResponse>({
    queryKey: SETTINGS_QUERY_KEYS.list(pair, query),
    queryFn: () => listDictionary(pair, query),
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
}

export interface UseDictionaryEntryQueryOptions<C extends DictionaryCategory> {
  pair: DictionaryPair<C>;
  id?: string;
  enabled?: boolean;
}

export function useDictionaryEntryQuery<C extends DictionaryCategory>({
  pair,
  id,
  enabled = true,
}: UseDictionaryEntryQueryOptions<C>) {
  const hasId = !!id;
  return useQuery<DictionarySettingsEntry>({
    queryKey: SETTINGS_QUERY_KEYS.detail(pair, id ?? ''),
    queryFn: () => getDictionaryEntry(pair, id!),
    enabled: enabled && hasId,
    retry: shouldRetry,
  });
}
