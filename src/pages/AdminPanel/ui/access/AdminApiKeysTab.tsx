import { useMemo, useState, type ReactNode } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  PlusCircle,
  Search,
  ShieldOff,
  X,
} from 'lucide-react';
import {
  useCreateExternalApiKeyMutation,
  useExternalApiKeysQuery,
  useExternalApiKeyScopesQuery,
  useRevokeExternalApiKeyMutation,
} from '@/api/externalApiKeys';
import { useApp } from '@/hooks/useApp';
import { formatServerErrorMessage } from '@/services/http';
import type { CreatedExternalApiKey, ExternalApiKey } from '@/types';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'secret'; key: CreatedExternalApiKey }
  | { kind: 'revoke'; key: ExternalApiKey };

type ApiKeyDisplayStatus = 'active' | 'expired' | 'revoked';

const API_KEY_STATUS_STYLES: Record<
  ApiKeyDisplayStatus,
  { backgroundColor: string; color: string }
> = {
  active: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    color: '#16A34A',
  },
  expired: {
    backgroundColor: 'rgba(245,158,11,0.14)',
    color: '#B45309',
  },
  revoked: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    color: '#DC2626',
  },
};

export function AdminApiKeysTab() {
  const { t, lang } = useApp();
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const keysQuery = useExternalApiKeysQuery();
  const scopesQuery = useExternalApiKeyScopesQuery();

  const keys = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    const source = keysQuery.data ?? [];
    if (!needle) return source;
    return source.filter((key) =>
      [key.name, key.keyPrefix, key.description ?? '', ...key.scopes]
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [keysQuery.data, search]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const statusLabels: Record<ApiKeyDisplayStatus, string> = {
    active: t.admin.apiKeys.statusActive,
    expired: t.admin.apiKeys.statusExpired,
    revoked: t.admin.apiKeys.statusRevoked,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.admin.apiKeys.searchPlaceholder}
            className="h-11 w-full rounded-lg pl-9 pr-3 text-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          disabled={scopesQuery.isPending || scopesQuery.isError}
          className="flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={16} />
          {t.admin.apiKeys.createButton}
        </button>
      </div>

      {scopesQuery.isError && (
        <div role="alert" className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
          {formatServerErrorMessage(scopesQuery.error) ?? t.admin.apiKeys.scopesLoadError}
        </div>
      )}

      <div className="grid gap-3">
        {keys.map((key) => {
          const displayStatus = getApiKeyDisplayStatus(key);
          const revoked = displayStatus === 'revoked';

          return (
            <div
              key={key.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {key.name}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-medium"
                      style={API_KEY_STATUS_STYLES[displayStatus]}
                    >
                      {statusLabels[displayStatus]}
                    </span>
                  </div>
                  {key.description && (
                    <p className="mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {key.description}
                    </p>
                  )}
                  <div className="mb-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {key.keyPrefix}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {key.scopes.map((scope) => (
                      <span key={scope} className="rounded-md px-2 py-1 text-xs" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-[280px] grid-cols-2 gap-x-5 gap-y-2 text-xs">
                  <Meta label={t.admin.apiKeys.createdAt} value={formatDate(key.createdAt)} />
                  <Meta label={t.admin.apiKeys.expiresAt} value={formatDate(key.expiresAt)} />
                  <Meta label={t.admin.apiKeys.lastUsedAt} value={formatDate(key.lastUsedAt)} />
                  <Meta label={t.admin.apiKeys.revokedAt} value={formatDate(key.revokedAt)} />
                </div>

                <button
                  type="button"
                  onClick={() => setDialog({ kind: 'revoke', key })}
                  disabled={revoked}
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ color: '#DC2626', border: '1px solid rgba(220,38,38,0.35)' }}
                >
                  <ShieldOff size={15} />
                  {t.admin.apiKeys.revokeButton}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {keysQuery.isPending && (
        <div className="flex items-center justify-center gap-2 py-10" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="animate-spin" />
          {t.admin.apiKeys.loading}
        </div>
      )}

      {keysQuery.isError && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--danger)' }}>
          {formatServerErrorMessage(keysQuery.error) ?? t.admin.apiKeys.loadError}
        </div>
      )}

      {!keysQuery.isPending && !keysQuery.isError && keys.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <KeyRound size={30} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t.admin.apiKeys.empty}
          </span>
        </div>
      )}

      {dialog.kind === 'create' && (
        <ApiKeyFormDialog
          scopes={scopesQuery.data ?? []}
          onClose={() => setDialog({ kind: 'closed' })}
          onCreated={(key) => setDialog({ kind: 'secret', key })}
        />
      )}
      {dialog.kind === 'secret' && (
        <ApiKeySecretDialog
          apiKey={dialog.key.apiKey}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      )}
      {dialog.kind === 'revoke' && (
        <ApiKeyRevokeDialog
          apiKey={dialog.key}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      )}
    </div>
  );
}

function ApiKeyFormDialog({
  scopes,
  onClose,
  onCreated,
}: {
  scopes: string[];
  onClose: () => void;
  onCreated: (key: CreatedExternalApiKey) => void;
}) {
  const { t } = useApp();
  const mutation = useCreateExternalApiKeyMutation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(() =>
    scopes.includes('benchmark-tests:read') ? ['benchmark-tests:read'] : [],
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const serverError = formatServerErrorMessage(mutation.error);

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((value) => value !== scope)
        : [...current, scope],
    );
  };

  const submit = async () => {
    if (!name.trim()) {
      setClientError(t.admin.apiKeys.nameRequiredError);
      return;
    }
    if (selectedScopes.length === 0) {
      setClientError(t.admin.apiKeys.scopeRequiredError);
      return;
    }

    setClientError(null);
    try {
      const created = await mutation.mutateAsync({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        scopes: selectedScopes,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      onCreated(created);
    } catch {
      // Mutation state renders the normalized server error in the dialog.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !mutation.isPending && onClose()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.admin.apiKeys.createTitle}</h2>
          <button type="button" onClick={onClose} disabled={mutation.isPending} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <FormField label={t.admin.apiKeys.nameLabel}>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>
          <FormField label={t.admin.apiKeys.descriptionLabel}>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>
          <FormField label={t.admin.apiKeys.expiresLabel} hint={t.admin.apiKeys.expiresHint}>
            <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t.admin.apiKeys.scopesLabel}</legend>
            {scopes.map((scope) => (
              <label key={scope} className="flex cursor-pointer items-start gap-3 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={selectedScopes.includes(scope)} onChange={() => toggleScope(scope)} className="mt-0.5" />
                <span>
                  <span className="block font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{scope}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{scopeDescription(
                    scope,
                    t.admin.apiKeys.scopeDescriptions as Readonly<Record<string, string>>,
                  )}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {(clientError || serverError) && <div role="alert" className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>{clientError ?? serverError}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={mutation.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{t.admin.apiKeys.cancel}</button>
            <button type="button" onClick={() => void submit()} disabled={mutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--accent)' }}>
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {t.admin.apiKeys.createButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeySecretDialog({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-bg, var(--bg-elevated))', color: 'var(--accent)' }}>
          <KeyRound size={18} />
        </div>
        <h2 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{t.admin.apiKeys.secretTitle}</h2>
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>{t.admin.apiKeys.secretHint}</p>
        <div className="break-all rounded-lg p-3 font-mono text-xs" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>{apiKey}</div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => void copy()} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? t.admin.apiKeys.copied : t.admin.apiKeys.copyButton}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>{t.admin.apiKeys.doneButton}</button>
        </div>
      </div>
    </div>
  );
}

function ApiKeyRevokeDialog({ apiKey, onClose }: { apiKey: ExternalApiKey; onClose: () => void }) {
  const { t } = useApp();
  const mutation = useRevokeExternalApiKeyMutation();
  const error = formatServerErrorMessage(mutation.error);

  const confirm = async () => {
    try {
      await mutation.mutateAsync(apiKey.id);
      onClose();
    } catch {
      // Mutation state renders the normalized server error in the dialog.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !mutation.isPending && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}><ShieldOff size={18} style={{ color: '#DC2626' }} /></div>
        <h2 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{t.admin.apiKeys.revokeTitle}</h2>
        <p className="mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{apiKey.name}</p>
        <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>{t.admin.apiKeys.revokeHint}</p>
        {error && <div role="alert" className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{t.admin.apiKeys.cancel}</button>
          <button type="button" onClick={() => void confirm()} disabled={mutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#DC2626' }}>
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {t.admin.apiKeys.revokeButton}
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{value}</div>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      {children}
      {hint && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  );
}

function scopeDescription(
  scope: string,
  descriptions: Readonly<Record<string, string>>,
): string {
  return descriptions[scope] ?? scope;
}

const inputStyle = {
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
};

function getApiKeyDisplayStatus(key: ExternalApiKey): ApiKeyDisplayStatus {
  if (key.status === 'REVOKED') return 'revoked';
  if (!key.expiresAt) return 'active';

  const expiresAtTimestamp = Date.parse(key.expiresAt);
  const expired =
    Number.isFinite(expiresAtTimestamp) && expiresAtTimestamp <= Date.now();

  return expired ? 'expired' : 'active';
}
