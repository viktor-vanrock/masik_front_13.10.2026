import { useFormContext, Controller } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@sberai/uikit';

interface RHFTextareaProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export const RHFTextarea = ({ name, label, required, placeholder, rows }: RHFTextareaProps) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field label={label} required={required} error={error || fieldState.error?.message}>
          <Textarea
            {...field}
            name={name}
            placeholder={placeholder}
            rows={rows}
            error={!!fieldState.error}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--bg-page)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              outline: 'none',
              color: 'var(--text-primary)',
            }}
          />
        </Field>
      )}
    />
  );
};