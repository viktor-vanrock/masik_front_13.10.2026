import { FormSection } from './FormSection';
import { FormField } from './FormField';
import { useApp } from '@/hooks/useApp';
import { useSuiteOptionsQuery } from '@/api/catalog';

interface Props {
  suiteId: string;
  onSuiteIdChange: (value: string) => void;
}

export const SuiteSection = ({ suiteId, onSuiteIdChange }: Props) => {
  const { t, lang } = useApp();
  const { data, isPending, isError } = useSuiteOptionsQuery();
  const options = data ?? [];

  return (
    <FormSection title={t.benchmark.suiteIdLabel}>
      <FormField label={t.benchmark.suiteIdLabel}>
        <select
          value={suiteId}
          onChange={(e) => onSuiteIdChange(e.target.value)}
          disabled={isPending || isError}
          className="w-full px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        >
          <option value="">{t.benchmark.suiteIdPlaceholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {lang === 'en' ? opt.nameEn : opt.name}
            </option>
          ))}
        </select>
        {isError && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
            {t.benchmark.suiteIdLoadingError}
          </p>
        )}
      </FormField>
    </FormSection>
  );
};
