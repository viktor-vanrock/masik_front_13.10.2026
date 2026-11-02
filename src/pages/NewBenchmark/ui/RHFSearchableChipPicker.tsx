import { useFormContext, Controller } from 'react-hook-form';
import { Field } from '@/components/ui/Field';
import { SearchableChipPicker } from '@/components/ui/SearchableChipPicker';
import { useApp } from '@/hooks/useApp';

interface Option {
  value: string;
  label: string;
}

interface RHFSearchableChipPickerProps {
  name: string;
  label?: string;
  options: Option[];
  placeholder?: string;
  onToggle?: (value: string, isSelected: boolean) => void;
}

export const RHFSearchableChipPicker = ({
  name,
  label = '',
  options,
  placeholder,
  onToggle: externalOnToggle,
}: RHFSearchableChipPickerProps) => {
  const { control, watch } = useFormContext();
  const { t } = useApp();
  const selected: string[] = watch(name) || [];

  const displayLabel = label && selected.length > 0
    ? `${label} ${t.newBenchmark.selectedSuffix.replace('{count}', String(selected.length))}`
    : label;

  const resolvedPlaceholder = placeholder ?? t.common.search;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const current: string[] = field.value || [];

        return (
          <Field label={displayLabel} error={fieldState.error?.message}>
            <SearchableChipPicker
              options={options}
              selected={current}
              onToggle={(value, isSelected) => {
                const next = isSelected
                  ? [...current, value]
                  : current.filter((v) => v !== value);
                field.onChange(next);
                externalOnToggle?.(value, isSelected);
              }}
              placeholder={resolvedPlaceholder}
            />
          </Field>
        );
      }}
    />
  );
};
