import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';
import type {
  CreateExternalApiKeyDto,
  CreatedExternalApiKey,
  ExternalApiKey,
} from '@/types';

export async function listExternalApiKeys(): Promise<ExternalApiKey[]> {
  const { data } = await httpClient.get<ExternalApiKey[]>(
    BACKEND_PATHS.externalApiKeys.list,
  );
  return data;
}

export async function listExternalApiKeyScopes(): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(
    BACKEND_PATHS.externalApiKeys.scopes,
  );
  return data;
}

export async function createExternalApiKey(
  dto: CreateExternalApiKeyDto,
): Promise<CreatedExternalApiKey> {
  const { data } = await httpClient.post<CreatedExternalApiKey>(
    BACKEND_PATHS.externalApiKeys.list,
    dto,
  );
  return data;
}

export async function revokeExternalApiKey(id: string): Promise<void> {
  await httpClient.delete(BACKEND_PATHS.externalApiKeys.detail(id));
}
