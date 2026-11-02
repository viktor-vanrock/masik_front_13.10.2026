import { Video } from 'lucide-react';
import { Section } from './Section';
import { useApp } from '@/hooks/useApp';

export function VideosSection() {
  const { t } = useApp();

  return (
    <Section icon={Video} title={t.guide.videosTitle}>
      <p className="text-sm text-muted">
        {t.guide.videosPlaceholder}
      </p>
    </Section>
  );
}