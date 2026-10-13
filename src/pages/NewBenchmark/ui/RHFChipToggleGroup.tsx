import { useFormContext, Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { Field } from '@/components/ui/Field';

interface Option {
  value: string;
  label: string;
  hint?: string;
}

interface RHFChipToggleGroupProps {
  name: string;
  label?: string;
  options: Option[];
}

export const RHFChipToggleGroup = ({
  name,
  label = '',
  options,
}: RHFChipToggleGroupProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected: string[] = field.value || [];

        return (
          <Field label={label}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {options.map(({ value, label: optionLabel, hint }) => {
                const isSelected = selected.includes(value);

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? selected.filter((v) => v !== value)
                        : [...selected, value];
                      field.onChange(next);
                    }}
                    className="flex flex-col items-start gap-0.5 p-3 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-blue-tint)' : 'var(--bg-elevated)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                      color: isSelected ? 'var(--text-blue-on-bg)' : 'var(--text-muted)',
                    }}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent)' : 'var(--border-strong)',
                        }}
                      >
                        {isSelected && <Check size={9} color="#fff" strokeWidth={3} />}
                      </span>
                      {optionLabel}
                    </span>
                    {hint && (
                      <span className="text-xs opacity-60 pl-5">{hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Field>
        );
      }}
    />
  );
};
