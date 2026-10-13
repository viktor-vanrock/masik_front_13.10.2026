export type ExternalApiKeyStatus = 'ACTIVE' | 'REVOKED';

export interface ExternalApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  description?: string;
  scopes: string[];
  status: ExternalApiKeyStatus;
  owner?: string;
  expiresAt?: string;
  revokedAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreatedExternalApiKey extends ExternalApiKey {
  apiKey: string;
}

export interface CreateExternalApiKeyDto {
  name: string;
  description?: string;
  scopes?: string[];
  expiresAt?: string;
}
