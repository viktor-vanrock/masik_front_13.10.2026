import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useSuitesQuery } from '@/api/catalog';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { isAdminRole } from '@/utils/auth/roles';
import { SearchInput } from '@/components/ui/SearchInput';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { BenchmarksGridSkeleton } from '@/pages/BenchmarksCatalogue/ui/BenchmarksGridSkeleton';
import type { BenchmarkSuite } from '@/types';
import { CategoriesTable } from './CategoriesTable';
import { CategoryFormDialog } from './CategoryFormDialog';
import { CategoryDeleteModal } from './CategoryDeleteModal';

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: BenchmarkSuite }
  | { kind: 'delete'; category: BenchmarkSuite };

export const AdminCategoriesTab = () => {
  const { t, userRole } = useApp();
  const canCreate = isAdminRole(userRole);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  const query = useMemo(() => {
    const trimmed = debouncedSearch.trim();
    return trimmed ? { search: trimmed, limit: 100 } : { limit: 100 };
  }, [debouncedSearch]);

  const { data, isPending, isError, error, refetch } = useSuitesQuery(query);
  const categories = data?.data ?? [];

  const close = () => setDialog({ kind: 'closed' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.admin.categories.searchPlaceholder}
          />
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setDialog({ kind: 'create' })}
            className="flex items-center gap-2 px-4 not-sm:py-4 mb-4 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <PlusCircle size={15} />
            {t.admin.categories.createBtn}
          </button>
        )}
      </div>

      {isError && <CatalogErrorState error={error} onRetry={refetch} />}

      {!isError && isPending && <BenchmarksGridSkeleton />}

      {!isError && !isPending && (
        <CategoriesTable
          categories={categories}
          onEdit={(c) => setDialog({ kind: 'edit', category: c })}
          onDelete={(c) => setDialog({ kind: 'delete', category: c })}
          labels={{
            colName: t.admin.categories.colName,
            colNameEn: t.admin.categories.colNameEn,
            colCount: t.admin.categories.colCount,
            colCreated: t.admin.categories.colCreated,
            colActions: t.admin.categories.colActions,
            editBtn: t.admin.categories.editBtn,
            deleteBtn: t.admin.categories.deleteBtn,
            noResults: t.admin.categories.noResults,
          }}
        />
      )}

      {dialog.kind === 'create' && <CategoryFormDialog onClose={close} />}
      {dialog.kind === 'edit' && (
        <CategoryFormDialog category={dialog.category} onClose={close} />
      )}
      {dialog.kind === 'delete' && (
        <CategoryDeleteModal category={dialog.category} onClose={close} />
      )}
    </div>
  );
};
