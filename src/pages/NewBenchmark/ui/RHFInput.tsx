import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';

interface RHFInputProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

export const RHFInput = ({ name, label, required, placeholder, type }: RHFInputProps) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field label={label} required={required} error={error || fieldState.error?.message}>
          <Input
            {...field}
            value={field.value ?? ''}
            type={type}
            placeholder={placeholder}
            error={!!fieldState.error}
          />
        </Field>
      )}
    />
  );
};