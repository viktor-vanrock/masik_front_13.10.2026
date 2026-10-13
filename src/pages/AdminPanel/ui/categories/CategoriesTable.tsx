import type { BenchmarkSuite } from '@/types';
import { BenchmarksTableHeader } from '../BenchmarksTableHeader';
import { CategoryRow } from './CategoryRow';

interface Props {
  categories: BenchmarkSuite[];
  onEdit: (c: BenchmarkSuite) => void;
  onDelete: (c: BenchmarkSuite) => void;
  labels: {
    colName: string;
    colNameEn: string;
    colCount: string;
    colCreated: string;
    colActions: string;
    editBtn: string;
    deleteBtn: string;
    noResults: string;
  };
}

export const CategoriesTable = ({ categories, onEdit, onDelete, labels }: Props) => {
  const columns = [
    { key: 'name', label: labels.colName },
    { key: 'nameEn', label: labels.colNameEn, hidden: 'hidden md:table-cell' },
    {
      key: 'count',
      label: labels.colCount,
      align: 'right' as const,
      hidden: 'hidden sm:table-cell',
    },
    { key: 'created', label: labels.colCreated, hidden: 'hidden lg:table-cell' },
    { key: 'actions', label: labels.colActions, align: 'right' as const },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <BenchmarksTableHeader columns={columns} />
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-muted"
                >
                  {labels.noResults}
                </td>
              </tr>
            ) : (
              categories.map((c, i) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  isLast={i === categories.length - 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  labels={{ edit: labels.editBtn, delete: labels.deleteBtn }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
