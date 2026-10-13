import { Terminal } from 'lucide-react';
import { Section } from './Section';
import { ExternalLink } from './ExternalLink';
import { CodeBlock } from './CodeBlock';
import { GITVERSE_GIGAMETRIC_REPO, gigametricDocsCatalogUrl } from '@config/externalLinks';
import { useApp } from '@/hooks/useApp';

export function RunSection() {
  const { t } = useApp();

  return (
    <Section icon={Terminal} title={t.guide.runTitle}>
      <ol className="text-sm space-y-2 list-decimal pl-5 mb-4 text-secondary">
        <li>{t.guide.runStepUv}</li>
        <li>
          {t.guide.runStepClone}{' '}
          <ExternalLink href={GITVERSE_GIGAMETRIC_REPO} showIcon={false}>
            GitVerse — GigaMetric
          </ExternalLink>
        </li>
        <li>{t.guide.runStepEnv}</li>
        <li>
          {t.guide.runStepCatalog}{' '}
          <ExternalLink href={gigametricDocsCatalogUrl()} showIcon={false}>
            docs/CATALOG.md
          </ExternalLink>
        </li>
        <li>{t.guide.runStepExample}</li>
      </ol>

      <CodeBlock code={t.guide.runSnippet} className="mb-2" />

      <p className="text-xs text-muted">
        {t.guide.runnerNote}
      </p>
    </Section>
  );
}