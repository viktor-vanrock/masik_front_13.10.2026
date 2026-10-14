import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { GITVERSE_GIGAMETRIC_REPO } from '@/config/externalLinks';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

export function Footer() {
  const { t } = useApp();

  return (
    <footer
      className="mt-auto"
      style={{ backgroundColor: 'var(--bg-footer)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' }}
            >
              B
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              BenchFactory © 2026
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to={ROUTES.CATALOGUE}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.nav.catalogue}
            </Link>
            <Link
              to={ROUTES.DASHBOARD}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.nav.dashboard}
            </Link>
            <a
              href={GITVERSE_GIGAMETRIC_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <GitBranch size={14} />
              GitVerse (GigaMetric)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
