import { useFormContext, Controller } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { useApp } from '@/hooks/useApp';
import { useSuiteOptionsQuery } from '@/api/catalog';

interface Props {
  name: string;
  required?: boolean;
}

export const RHFSuiteSelect = ({ name, required }: Props) => {
  const { t, lang } = useApp();
  const { control } = useFormContext();
  const { data, isPending, isError } = useSuiteOptionsQuery();
  const options = data ?? [];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          label={t.benchmark.suiteIdLabel}
          required={required}
          error={isError ? t.benchmark.suiteIdLoadingError : fieldState.error?.message}
          htmlFor={name}
        >
          <select
            id={name}
            {...field}
            disabled={isPending || isError}
            aria-invalid={!!fieldState.error}
            className="w-full px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: `1px solid ${fieldState.error ? 'var(--danger)' : 'var(--border)'}`,
            }}
          >
            <option value="">{t.benchmark.suiteIdPlaceholder}</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {lang === 'en' ? opt.nameEn : opt.name}
              </option>
            ))}
          </select>
        </Field>
      )}
    />
  );
};
