import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { selectBenchmarkTestVM } from '@/features/catalog/selectors';
import type { BenchmarkType } from '@/types';
import type { AppLang } from '@/features/catalog/selectors';
import { BenchmarkActions } from './BenchmarkActions';

interface BenchmarkTableRowProps {
  benchmark: BenchmarkType;
  lang: AppLang;
  isLast: boolean;
  onUpload: (benchmark: BenchmarkType) => void;
  onDelete: (benchmark: BenchmarkType) => void;
  labels: {
    validationBadge: string;
    upload: string;
    edit: string;
    delete: string;
  };
}

export function BenchmarkTableRow({
  benchmark,
  lang,
  isLast,
  onUpload,
  onDelete,
  labels,
}: BenchmarkTableRowProps) {
  const vm = useMemo(
    () => selectBenchmarkTestVM(benchmark, lang),
    [benchmark, lang],
  );
  const scoresCount = vm.scores.filter((s) => !s.isHumanBaseline).length;
  const macroGroupLabel = vm.macroGroup?.label ?? '—';

  return (
    <tr
      className="bg-bg-card"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
      }}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/benchmark/${vm.id}`}
            className="font-medium text-primary hover:underline"
          >
            {vm.displayName}
          </Link>
          {vm.validationStatus === 'validation' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-bg-blue-tint text-accent">
              {labels.validationBadge}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 text-muted md:hidden">{macroGroupLabel}</p>
      </td>

      <td className="py-3 px-4 hidden md:table-cell">
        <span
          className="flex text-xs px-2 py-0.5 rounded bg-bg-blue-tint text-blue-on-bg"
          style={{
            backgroundColor: 'var(--bg-blue-tint)',
            color: 'var(--text-blue-on-bg)',
          }}
        >
          {macroGroupLabel}
        </span>
      </td>

      <td
        className="py-3 px-4 text-right hidden sm:table-cell text-xs text-secondary"
        style={{ color: 'var(--text-secondary)' }}
      >
        {vm.sizeInSamples.toLocaleString()}
      </td>

      <td
        className="py-3 px-4 text-right hidden sm:table-cell text-xs text-secondary"
        style={{ color: 'var(--text-secondary)' }}
      >
        {scoresCount}
      </td>

      <td className="py-3 px-4">
        <BenchmarkActions
          benchmark={benchmark}
          onUpload={onUpload}
          onDelete={onDelete}
          labels={{
            upload: labels.upload,
            edit: labels.edit,
            delete: labels.delete,
          }}
        />
      </td>
    </tr>
  );
}
