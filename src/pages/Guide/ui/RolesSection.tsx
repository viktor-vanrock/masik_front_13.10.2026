import { BookOpen } from 'lucide-react';
import { Section } from './Section';
import { useApp } from '@/hooks/useApp';

export function RolesSection() {
  const { t } = useApp();

  return (
    <Section icon={BookOpen} title={t.guide.rolesTitle}>
      <ul className="text-sm space-y-2 list-disc pl-5 text-secondary">
        <li>{t.guide.rolesBenchFactory}</li>
        <li>{t.guide.rolesGigaMetric}</li>
      </ul>
    </Section>
  );
}