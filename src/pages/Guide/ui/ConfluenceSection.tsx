import { FileText } from 'lucide-react';
import { Section } from '../ui/Section';
import { ExternalLink } from './ExternalLink';
import { CONFLUENCE_BENCHMARK_ROLLOUT } from '@config/externalLinks';
import { useApp } from '@/hooks/useApp';

export function ConfluenceSection() {
  const { t } = useApp();

  return (
    <Section icon={FileText} title={t.guide.confluenceTitle}>
      <ExternalLink href={CONFLUENCE_BENCHMARK_ROLLOUT}>
        {t.guide.confluenceLink}
      </ExternalLink>
    </Section>
  );
}