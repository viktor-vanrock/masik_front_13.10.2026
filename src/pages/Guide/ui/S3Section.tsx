import { HardDrive } from 'lucide-react';
import { Section } from './Section';
import { CodeBlock } from './CodeBlock';
import { useApp } from '@/hooks/useApp';

export function S3Section() {
  const { t } = useApp();

  const s3Url = import.meta.env.VITE_S3_DATASETS_URL || 's3://benchfactory-datasets';
  const s3Command = `aws s3 cp ${s3Url}/<adapter-name>/ ./data/ --recursive`;

  return (
    <Section icon={HardDrive} title={t.guide.s3Title}>
      <p className="text-sm mb-3 text-secondary">
        {t.guide.s3Intro}
      </p>

      <ol className="text-sm space-y-2 list-decimal pl-5 mb-4 text-secondary">
        <li>{t.guide.s3Step1}</li>
        <li>
          {t.guide.s3Step2}
          <CodeBlock code={s3Command} className="mt-2" />
        </li>
        <li>{t.guide.s3Step3}</li>
      </ol>
    </Section>
  );
}