import { Image as ImageIcon } from 'lucide-react';
import { Section } from './Section';
import { Placeholder } from './Placeholder';
import { useApp } from '@/hooks/useApp';

export function IllustratedSection() {
  const { t } = useApp();

  return (
    <Section icon={ImageIcon} title={t.guide.illustratedTitle}>
      <p className="text-sm mb-3 text-secondary">
        {t.guide.illustratedBody}
      </p>
      <Placeholder text={t.guide.imagePlaceholder} />
    </Section>
  );
}