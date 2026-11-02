import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, PlusCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useDictionaryListQuery } from '@/api/settings';
import { ROUTES } from '@/routes/routes.constants';
import { isAdminRole } from '@/utils/auth/roles';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import type { DictionaryCategory, DictionarySettingsEntry } from '@/types';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { DictionaryFormDialog } from './DictionaryFormDialog';
import { DictionaryDeleteModal } from './DictionaryDeleteModal';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; entry: DictionarySettingsEntry }
  | { kind: 'delete'; entry: DictionarySettingsEntry };

type PairCast = Parameters<typeof useDictionaryListQuery>[0];

interface Props {
  category: DictionaryCategory;
  type: string;
  /** Если передан — рисует кнопку «← Все словари». Иначе — Link «← Панель администратора». */
  onBack?: () => void;
}

export function DictionaryContent({ category, type, onBack }: Props) {
  const { t, lang, userRole } = useApp();
  const s = t.admin.settings;
  const canEdit = isAdminRole(userRole);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  const query = useMemo(
    () => (debouncedSearch.trim() ? { search: debouncedSearch.trim(), limit: 100 } : { limit: 100 }),
    [debouncedSearch],
  );

  const { data, isPending, isError, error, refetch } = useDictionaryListQuery(
    { category, type } as PairCast,
    query,
  );
  const entries = data?.data ?? [];
  const close = () => setDialog({ kind: 'closed' });

  const typeLabel: Partial<Record<string, string>> = {
    'macro-groups': t.catalogue.macroGroup,
    'sub-groups': t.catalogue.subGroup,
    'ability-taxons': t.catalogue.abilityTaxon,
    'task-types': t.catalogue.taskType,
    'modalities': t.catalogue.modality,
    'languages': t.catalogue.language,
    'difficulties': t.catalogue.difficulty,
    'capabilities': t.catalogue.capabilitiesSection,
    'domains': t.catalogue.domain,
    'subdomains': t.catalogue.subdomain,
  };
  const title = typeLabel[type] ?? type;

  return (
    <div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          {s.backToDictionaries}
        </button>
      ) : (
        <Link
          to={ROUTES.ADMIN}
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          {s.backToAdmin}
        </Link>
      )}

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {data?.total ?? '—'} {s.records}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setDialog({ kind: 'create' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <PlusCircle size={15} />
            {s.createBtn}
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={s.searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {isError && <CatalogErrorState error={error} onRetry={refetch} />}

      {!isError && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-2.5 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.colNameRu}
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.colNameEn}
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.colUsage}
                </th>
                {canEdit && (
                  <th className="px-4 py-2.5" style={{ width: 120 }} />
                )}
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t.common.loading}
                  </td>
                </tr>
              )}
              {!isPending && entries.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.noEntries}
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    {lang === 'ru' ? entry.name : entry.nameEn}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {entry.nameEn}
                  </td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                    {entry.usageCount}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: 'edit', entry })}
                          className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: 'var(--accent)', backgroundColor: 'var(--bg-blue-tint)' }}
                        >
                          {s.editBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: 'delete', entry })}
                          className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-70"
                          style={{ color: '#DC2626', backgroundColor: '#FEF2F2' }}
                        >
                          {s.deleteBtn}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog.kind === 'create' && (
        <DictionaryFormDialog category={category} type={type} onClose={close} />
      )}
      {dialog.kind === 'edit' && (
        <DictionaryFormDialog category={category} type={type} entry={dialog.entry} onClose={close} />
      )}
      {dialog.kind === 'delete' && (
        <DictionaryDeleteModal category={category} type={type} entry={dialog.entry} onClose={close} />
      )}
    </div>
  );
}
