import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { RHFRadioGroup } from './RHFRadioGroup';
import { RHFChipPicker } from './RHFChipPicker';
import { RHFSearchableChipPicker } from './RHFSearchableChipPicker';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

export const Step2 = () => {
  const { t, lang } = useApp();
  const s = t.newBenchmark.step2;
  const { data: aggregate } = useSettingsAggregateQuery();
  const { watch, setValue } = useFormContext();

  const macroGroupId: string = watch('macroGroupId') ?? '';

  const macroGroupOptions = useMemo(
    () => (aggregate?.taxonomy.macroGroups ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const subGroupOptions = useMemo(() => {
    const all = aggregate?.taxonomy.subGroups ?? [];
    const source = macroGroupId
      ? all.filter((sg) => sg.macroGroupId === macroGroupId)
      : all;
    return source.map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }));
  }, [aggregate, macroGroupId, lang]);

  const abilityTaxonOptions = useMemo(
    () => (aggregate?.taxonomy.abilityTaxons ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const handleMacroGroupChange = () => {
    setValue('subGroupIds', [], { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <RHFRadioGroup
        name="macroGroupId"
        label={s.macroGroupLabel}
        required
        options={macroGroupOptions}
        onAfterChange={handleMacroGroupChange}
      />

      {macroGroupId && (
        <RHFChipPicker
          name="subGroupIds"
          label={s.subGroupsLabel}
          options={subGroupOptions}
        />
      )}

      <RHFSearchableChipPicker
        name="abilityTaxonIds"
        label={s.abilityTaxonsLabel}
        options={abilityTaxonOptions}
        placeholder={s.abilityTaxonsPlaceholder}
      />
    </div>
  );
};
