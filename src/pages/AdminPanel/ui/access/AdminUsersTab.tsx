import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  PlusCircle,
  Trash2,
  UserRoundCog,
  X,
} from 'lucide-react';
import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from '@/api/adminUsers';
import { SearchInput } from '@/components/ui/SearchInput';
import { useApp } from '@/hooks/useApp';
import { formatServerErrorMessage } from '@/services/http';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import type {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  User,
  UserRole,
} from '@/types';

const PAGE_SIZE = 10;
const USER_ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPERUSER'];

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; user: User }
  | { kind: 'delete'; user: User };

export function AdminUsersTab() {
  const { t, lang, user: currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });
  const debouncedSearch = useDebouncedValue(search, 300);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPage(1), [debouncedSearch]);

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      sortColumn: 'createdAt' as const,
      sortDirection: 'DESC' as const,
    }),
    [page, debouncedSearch],
  );

  const usersQuery = useAdminUsersQuery(query);
  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.admin.users.searchPlaceholder}
            containerClassName="mb-0"
            inputClassName="h-11"
          />
        </div>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          className="flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={16} />
          {t.admin.users.createButton}
        </button>
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="px-4 py-3 font-medium">{t.admin.users.colUsername}</th>
                <th className="px-4 py-3 font-medium">{t.admin.users.colEmail}</th>
                <th className="px-4 py-3 font-medium">{t.admin.users.colRole}</th>
                <th className="px-4 py-3 font-medium">{t.admin.users.colCreated}</th>
                <th className="px-4 py-3 text-right font-medium">{t.admin.users.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {user.username}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user.id}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {user.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      {t.roles[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: 'edit', user })}
                        disabled={user.id === currentUser?.id}
                        className="rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-35"
                        style={{ color: 'var(--text-muted)' }}
                        title={
                          user.id === currentUser?.id
                            ? t.admin.users.cannotEditSelf
                            : t.admin.users.editButton
                        }
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ kind: 'delete', user })}
                        disabled={user.id === currentUser?.id}
                        className="rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-35"
                        style={{ color: 'var(--danger)' }}
                        title={
                          user.id === currentUser?.id
                            ? t.admin.users.cannotDeleteSelf
                            : t.admin.users.deleteButton
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usersQuery.isPending && (
          <div className="flex items-center justify-center gap-2 px-4 py-10" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={18} className="animate-spin" />
            {t.admin.users.loading}
          </div>
        )}

        {usersQuery.isError && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--danger)' }}>
            {formatServerErrorMessage(usersQuery.error) ?? t.admin.users.loadError}
          </div>
        )}

        {!usersQuery.isPending && !usersQuery.isError && users.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <UserRoundCog size={28} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.admin.users.empty}
            </span>
          </div>
        )}

        <div
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t.admin.users.total.replace('{count}', String(total))}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || usersQuery.isFetching}
              className="rounded-lg p-2 disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-24 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t.admin.users.page
                .replace('{page}', String(page))
                .replace('{total}', String(totalPages))}
            </span>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages || usersQuery.isFetching}
              className="rounded-lg p-2 disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {dialog.kind === 'create' && (
        <UserFormDialog onClose={() => setDialog({ kind: 'closed' })} />
      )}
      {dialog.kind === 'edit' && (
        <UserFormDialog
          user={dialog.user}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      )}
      {dialog.kind === 'delete' && (
        <UserDeleteDialog
          user={dialog.user}
          onClose={() => setDialog({ kind: 'closed' })}
        />
      )}
    </div>
  );
}

function UserFormDialog({ user, onClose }: { user?: User; onClose: () => void }) {
  const { t } = useApp();
  const createMutation = useCreateAdminUserMutation();
  const updateMutation = useUpdateAdminUserMutation();
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'USER');
  const [clientError, setClientError] = useState<string | null>(null);
  const isPending = createMutation.isPending || updateMutation.isPending;
  const serverError = formatServerErrorMessage(createMutation.error ?? updateMutation.error);

  const submit = async () => {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();
    if (!normalizedUsername || !normalizedEmail) {
      setClientError(t.admin.users.requiredError);
      return;
    }
    if (!user && !password) {
      setClientError(t.admin.users.passwordRequiredError);
      return;
    }

    setClientError(null);
    try {
      if (user) {
        const dto: UpdateAdminUserDto = {
          username: normalizedUsername,
          email: normalizedEmail,
          role,
          ...(password ? { password } : {}),
        };
        await updateMutation.mutateAsync({ id: user.id, dto });
      } else {
        const dto: CreateAdminUserDto = {
          username: normalizedUsername,
          email: normalizedEmail,
          password,
          role,
        };
        await createMutation.mutateAsync(dto);
      }
      onClose();
    } catch {
      // Mutation state renders the normalized server error in the dialog.
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {user ? t.admin.users.editTitle : t.admin.users.createTitle}
          </h2>
          <button type="button" onClick={onClose} disabled={isPending} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <FormField label={t.admin.users.usernameLabel}>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>
          <FormField label={t.admin.users.emailLabel}>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>
          <FormField label={user ? t.admin.users.newPasswordLabel : t.admin.users.passwordLabel} hint={t.admin.users.passwordHint}>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </FormField>
          <FormField label={t.admin.users.roleLabel}>
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>{t.roles[value]}</option>
              ))}
            </select>
          </FormField>

          {(clientError || serverError) && (
            <div role="alert" className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
              {clientError ?? serverError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {t.admin.users.cancel}
            </button>
            <button type="button" onClick={() => void submit()} disabled={isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--accent)' }}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {user ? t.admin.users.saveButton : t.admin.users.createButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDeleteDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const { t } = useApp();
  const mutation = useDeleteAdminUserMutation();
  const error = formatServerErrorMessage(mutation.error);

  const confirm = async () => {
    try {
      await mutation.mutateAsync(user.id);
      onClose();
    } catch {
      // Mutation state renders the normalized server error in the dialog.
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !mutation.isPending && onClose()}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
          <Trash2 size={18} style={{ color: '#DC2626' }} />
        </div>
        <h2 className="mb-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{t.admin.users.deleteTitle}</h2>
        <p className="mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{user.username}</p>
        <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>{t.admin.users.deleteHint}</p>
        {error && <div role="alert" className="mb-4 rounded-lg p-3 text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} disabled={mutation.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{t.admin.users.cancel}</button>
          <button type="button" onClick={() => void confirm()} disabled={mutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#DC2626' }}>
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {t.admin.users.deleteButton}
          </button>
        </div>
      </div>
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

const inputStyle = {
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
};
