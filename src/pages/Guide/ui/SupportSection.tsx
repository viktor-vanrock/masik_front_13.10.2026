import { MessageCircle } from 'lucide-react';
import { Section } from './Section';
import { ExternalLink } from './ExternalLink';
import { SUPPORT_CHAT_URL } from '@config/externalLinks';
import { useApp } from '@/hooks/useApp';

export function SupportSection() {
  const { t } = useApp();

  return (
    <Section icon={MessageCircle} title={t.guide.supportTitle}>
      {SUPPORT_CHAT_URL ? (
        <ExternalLink href={SUPPORT_CHAT_URL} showIcon={false}>
          {t.guide.supportLink}
        </ExternalLink>
      ) : (
        <p className="text-sm text-muted">
          {t.guide.supportPlaceholder}
        </p>
      )}
    </Section>
  );
}