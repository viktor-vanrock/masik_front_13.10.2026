import { httpClient } from '@/services/http';
import { BACKEND_PATHS } from '@/api/endpoints';
import { buildSettingsListSearchParams } from './buildSettingsListSearchParams';
import type {
  CreateDictionaryDto,
  DictionaryCategory,
  DictionaryPair,
  DictionarySettingsEntry,
  DictionarySettingsListQuery,
  DictionarySettingsListResponse,
  SettingsAggregate,
  UpdateDictionaryDto,
} from '@/types';

export async function getSettingsAggregate(): Promise<SettingsAggregate> {
  const { data } = await httpClient.get<SettingsAggregate>(BACKEND_PATHS.settings.aggregate);
  return data;
}

export async function listDictionary<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  query: DictionarySettingsListQuery = {},
): Promise<DictionarySettingsListResponse> {
  const params = buildSettingsListSearchParams(query);
  const { data } = await httpClient.get<DictionarySettingsListResponse>(
    BACKEND_PATHS.settings.list(pair.category, pair.type),
    { params },
  );
  return data;
}

export async function getDictionaryEntry<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  id: string,
): Promise<DictionarySettingsEntry> {
  const { data } = await httpClient.get<DictionarySettingsEntry>(
    BACKEND_PATHS.settings.detail(pair.category, pair.type, id),
  );
  return data;
}

export async function createDictionaryEntry<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  dto: CreateDictionaryDto,
): Promise<DictionarySettingsEntry> {
  const { data } = await httpClient.post<DictionarySettingsEntry>(
    BACKEND_PATHS.settings.list(pair.category, pair.type),
    dto,
  );
  return data;
}

export async function updateDictionaryEntry<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  id: string,
  patch: UpdateDictionaryDto,
): Promise<DictionarySettingsEntry> {
  const { data } = await httpClient.patch<DictionarySettingsEntry>(
    BACKEND_PATHS.settings.detail(pair.category, pair.type, id),
    patch,
  );
  return data;
}

export async function deleteDictionaryEntry<C extends DictionaryCategory>(
  pair: DictionaryPair<C>,
  id: string,
): Promise<void> {
  await httpClient.delete(BACKEND_PATHS.settings.detail(pair.category, pair.type, id));
}
