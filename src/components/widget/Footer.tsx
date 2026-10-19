import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { GITVERSE_GIGAMETRIC_REPO } from '@/config/externalLinks';
import { useApp } from '@/hooks/useApp';
import { NexTestLogo } from './Navbar';

export function Footer() {
  const { t } = useApp();

  return (
    <footer
      className="mt-auto"
      style={{ backgroundColor: '#fff', borderTop: '1px solid var(--border)' }}
    >
      <div className="mx-auto max-w-[1360px] px-5 py-7 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <Link to="/" aria-label="NexTest — главная" className="flex flex-none items-center no-underline">
            <NexTestLogo />
          </Link>
          <span className="text-center text-[11px] leading-[1.3] text-[#686e78]">
            Среда создания бенчмарков и оценки моделей · 2026
          </span>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.nav.catalogue}
            </Link>
            <Link
              to="/dashboard"
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
