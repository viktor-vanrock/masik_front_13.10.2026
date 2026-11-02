import { Link } from 'react-router-dom';
import { Shield, PlusCircle, Database, ClipboardList } from 'lucide-react';
import { useManagementBenchmarksQuery } from '@/api/catalog';
import { useApp } from '@/hooks/useApp';
import { StatCard } from './StatCard';

export function AdminPageHeader() {
  const { t } = useApp();
  // Total всех бенчмарков.
  const { data: totalData } = useManagementBenchmarksQuery({ limit: 1 });
  const total = totalData?.total ?? 0;

  // Pending validation count (отдельный запрос, дедуплицируется TanStack Query'ем).
  const { data: validationData } = useManagementBenchmarksQuery({ limit: 100 });
  const pendingCount = (validationData?.data ?? []).filter(
    (b) => b.validationStatus === 'validation',
  ).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-blue-tint)' }}
          >
            <Shield size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t.admin.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.admin.subtitle}
            </p>
          </div>
        </div>
        <Link
          to="/add-benchmark"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white self-start sm:self-auto flex-shrink-0"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <PlusCircle size={15} />
          {t.admin.addBenchmark}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={<Database size={16} />}
          label={t.admin.totalBenchmarks}
          value={total}
          accent
        />
        {pendingCount > 0 && (
          <StatCard
            icon={<ClipboardList size={16} />}
            label={t.admin.validationBadge}
            value={pendingCount}
            warning
          />
        )}
      </div>
    </div>
  );
}
