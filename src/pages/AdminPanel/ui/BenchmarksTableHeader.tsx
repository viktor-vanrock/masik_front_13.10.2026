interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  hidden?: string; // Tailwind класс для скрытия
}

interface BenchmarksTableHeaderProps {
  columns: TableColumn[];
}

export function BenchmarksTableHeader({ columns }: BenchmarksTableHeaderProps) {
  return (
    <thead>
      <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        {columns.map((column) => (
          <th
            key={column.key}
            className={`py-3 px-4 text-xs font-medium text-muted ${
              column.align === 'right' ? 'text-right' : 'text-left'
            } ${column.hidden || ''}`}
            style={{ color: 'var(--text-muted)' }}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}