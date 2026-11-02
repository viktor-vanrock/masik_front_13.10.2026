import { useApp } from '@/hooks/useApp';
import { formatLocaleDate } from '@/utils/format/date';
import type { BenchmarkSuite } from '@/types';
import { CategoryActions } from './CategoryActions';

interface Props {
  category: BenchmarkSuite;
  isLast: boolean;
  onEdit: (c: BenchmarkSuite) => void;
  onDelete: (c: BenchmarkSuite) => void;
  labels: { edit: string; delete: string };
}

export const CategoryRow = ({ category, isLast, onEdit, onDelete, labels }: Props) => {
  const { lang } = useApp();
  const displayName = lang === 'en' ? category.nameEn : category.name;

  return (
    <tr
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <td className="py-3 px-4">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {displayName}
        </p>
      </td>
      <td
        className="py-3 px-4 text-xs hidden md:table-cell"
        style={{ color: 'var(--text-secondary)' }}
      >
        {lang === 'en' ? category.name : category.nameEn}
      </td>
      <td
        className="py-3 px-4 text-right text-xs hidden sm:table-cell"
        style={{ color: 'var(--text-secondary)' }}
      >
        {category.benchmarkTestsCount}
      </td>
      <td
        className="py-3 px-4 text-xs hidden lg:table-cell"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatLocaleDate(lang, category.createdAt)}
      </td>
      <td className="py-3 px-4">
        <CategoryActions
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          labels={labels}
        />
      </td>
    </tr>
  );
};
