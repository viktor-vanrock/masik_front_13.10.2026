import { Link } from 'react-router-dom';
import { RolesSection } from './ui/RolesSection';
import { RunSection } from './ui/RunSection';
import { VideosSection } from './ui/VideosSection';
import { IllustratedSection } from './ui/IllustratedSection';
import { ConfluenceSection } from './ui/ConfluenceSection';
import { SupportSection } from './ui/SupportSection';
import { S3Section } from './ui/S3Section';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

export function Guide() {
  const { t } = useApp();

  return (
    <div className="min-h-screen">
      <div 
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
        style={{backgroundColor: 'var(--badge-blue-bg)'}}
      >
        <header className="mb-8">
          <h1 className="text-xl font-semibold mb-2 text-primary">
            {t.guide.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            {t.guide.intro}
          </p>
        </header>

        <div className="space-y-10">
          <RolesSection />
          <RunSection />
          <VideosSection />
          <IllustratedSection />
          <ConfluenceSection />
          <SupportSection />
          <S3Section />
        </div>

        <footer className="mt-10 pt-6 border-t border-border-default">
          <Link 
            to={ROUTES.CATALOGUE}
            className="text-sm font-medium text-accent hover:underline transition-all"
          >
            {t.guide.backCatalogue}
          </Link>
        </footer>
      </div>
    </div>
  );
}
