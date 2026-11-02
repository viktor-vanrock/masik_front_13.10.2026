import { useFormContext, Controller } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { ChipPicker } from '@/components/ui/ChipPicker';
import { useApp } from '@/hooks/useApp';

interface Option {
  value: string;
  label: string;
}

interface RHFChipPickerProps {
  name: string;
  label: string;
  options: Option[];
  placeholder?: string;
}

export const RHFChipPicker = ({ name, label, options }: RHFChipPickerProps) => {
  const { control } = useFormContext();
  const { t } = useApp();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value || [];
        const labelWithCount = selected.length > 0
          ? `${label} ${t.newBenchmark.selectedSuffix.replace('{count}', String(selected.length))}`
          : label;

        return (
          <Field label={labelWithCount} error={fieldState.error?.message}>
            <ChipPicker
              options={options}
              selected={selected}
              onToggle={(value) => {
                const next = selected.includes(value)
                  ? selected.filter((v) => v !== value)
                  : [...selected, value];
                field.onChange(next);
              }}
            />
          </Field>
        );
      }}
    />
  );
};
