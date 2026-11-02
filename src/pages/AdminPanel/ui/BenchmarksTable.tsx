// components/admin/BenchmarksTable.tsx
import type { AppLang } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import { BenchmarksTableHeader } from './BenchmarksTableHeader';
import { BenchmarkTableRow } from './BenchmarkTableRow';

interface BenchmarksTableProps {
  benchmarks: BenchmarkType[];
  lang: AppLang;
  onUpload: (benchmark: BenchmarkType) => void;
  onDelete: (benchmark: BenchmarkType) => void;
  labels: {
    colName: string;
    colGroup: string;
    colSamples: string;
    colScores: string;
    colActions: string;
    validationBadge: string;
    upload: string;
    edit: string;
    delete: string;
    noResults: string;
  };
}

export function BenchmarksTable({
  benchmarks,
  lang,
  onUpload,
  onDelete,
  labels,
}: BenchmarksTableProps) {
  const columns = [
    { key: 'name', label: labels.colName },
    { key: 'group', label: labels.colGroup, hidden: 'hidden md:table-cell' },
    { key: 'samples', label: labels.colSamples, align: 'right' as const, hidden: 'hidden sm:table-cell' },
    { key: 'scores', label: labels.colScores, align: 'right' as const, hidden: 'hidden sm:table-cell' },
    { key: 'actions', label: labels.colActions, align: 'right' as const },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <BenchmarksTableHeader columns={columns} />
          <tbody>
            {benchmarks.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="py-12 text-center text-sm text-muted"
                >
                  {labels.noResults}
                </td>
              </tr>
            ) : (
              benchmarks.map((benchmark, index) => (
                <BenchmarkTableRow
                  key={benchmark.id}
                  benchmark={benchmark}
                  lang={lang}
                  isLast={index === benchmarks.length - 1}
                  onUpload={onUpload}
                  onDelete={onDelete}
                  labels={labels}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}