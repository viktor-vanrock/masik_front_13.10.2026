import { useFormContext, Controller } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { RadioChip } from '@/components/ui/RadioChip';

interface Option {
  value: string;
  label: string;
}

interface RHFRadioGroupProps {
  name: string;
  label: string;
  required?: boolean;
  options: Option[] | string[];
  onAfterChange?: (value: string) => void;
}

export const RHFRadioGroup = ({
  name,
  label,
  required,
  options,
  onAfterChange,
}: RHFRadioGroupProps) => {
  const { control } = useFormContext();

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field label={label} required={required} error={fieldState.error?.message}>
          <div className="space-y-1.5">
            {normalizedOptions.map((option) => (
              <RadioChip
                key={option.value}
                label={option.label}
                selected={field.value === option.value}
                onClick={() => {
                  field.onChange(option.value);
                  onAfterChange?.(option.value);
                }}
              />
            ))}
          </div>
        </Field>
      )}
    />
  );
};
