import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { FormSection } from '../ui/FormSection';
import { ChipToggle } from './ChipToggle';
import { useSettingsAggregateQuery } from '@/api/settings';
import { pickLocalizedName } from '@/features/catalog/selectors';

interface Props {
  abilityTaxonIds: string[];
  onToggle: (id: string) => void;
}

export const AbilityTaxonsSection = ({ abilityTaxonIds, onToggle }: Props) => {
  const { t, lang } = useApp();
  const { data: aggregate } = useSettingsAggregateQuery();

  const options = useMemo(
    () =>
      (aggregate?.taxonomy.abilityTaxons ?? []).map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, lang),
      })),
    [aggregate, lang],
  );

  return (
    <FormSection title={t.admin.sectionAbilities}>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label }) => (
          <ChipToggle
            key={value}
            label={label}
            active={abilityTaxonIds.includes(value)}
            onToggle={() => onToggle(value)}
          />
        ))}
      </div>
    </FormSection>
  );
};
