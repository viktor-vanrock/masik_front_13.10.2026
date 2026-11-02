import { useMemo } from 'react';
import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { SelectInput } from './SelectInput';
import { ChipToggle } from './ChipToggle';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

interface Props {
  macroGroupId: string;
  subGroupIds: string[];
  onMacroGroupChange: (id: string) => void;
  onSubGroupToggle: (id: string) => void;
}

export const TaxonomySection = ({
  macroGroupId,
  subGroupIds,
  onMacroGroupChange,
  onSubGroupToggle,
}: Props) => {
  const { t, lang } = useApp();
  const { data: aggregate } = useSettingsAggregateQuery();

  const macroGroupOptions = useMemo(
    () => [
      { value: '', label: '—' },
      ...(aggregate?.taxonomy.macroGroups ?? []).map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, lang),
      })),
    ],
    [aggregate, lang],
  );

  const subGroupOptions = useMemo(() => {
    if (!macroGroupId) return [];
    return (aggregate?.taxonomy.subGroups ?? [])
      .filter((sg) => sg.macroGroupId === macroGroupId)
      .map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }));
  }, [aggregate, macroGroupId, lang]);

  return (
    <FormSection title={t.admin.sectionTaxonomy}>
      <FormField label={t.benchmark.macroGroup}>
        <SelectInput
          value={macroGroupId}
          onChange={onMacroGroupChange}
          options={macroGroupOptions}
        />
      </FormField>

      {macroGroupId && subGroupOptions.length > 0 && (
        <FormField label={t.benchmark.subGroup}>
          <div className="flex flex-wrap gap-2">
            {subGroupOptions.map(({ value, label }) => (
              <ChipToggle
                key={value}
                label={label}
                active={subGroupIds.includes(value)}
                onToggle={() => onSubGroupToggle(value)}
              />
            ))}
          </div>
        </FormField>
      )}
    </FormSection>
  );
};
