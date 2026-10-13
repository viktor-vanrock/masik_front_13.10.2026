import { useFormContext } from 'react-hook-form';
import { useMemo } from 'react';
import { RHFSearchableChipPicker } from './RHFSearchableChipPicker';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

export const Step4 = () => {
  const { t, lang } = useApp();
  const s = t.newBenchmark.step4;
  const { data: aggregate } = useSettingsAggregateQuery();
  const { watch, setValue } = useFormContext();

  const domainOptions = useMemo(
    () => (aggregate?.domains.domains ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const selectedDomainIds = watch('domainIds') as string[] | undefined;

  const subdomainOptions = useMemo(() => {
    const ids = selectedDomainIds ?? [];
    if (!ids.length) return [];
    return (aggregate?.domains.subdomains ?? [])
      .filter((sd) => ids.includes(sd.domainId))
      .map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }));
  }, [aggregate, selectedDomainIds, lang]);

  const handleDomainToggle = (domainId: string, isSelected: boolean) => {
    if (!isSelected) {
      const subIds = (aggregate?.domains.subdomains ?? [])
        .filter((sd) => sd.domainId === domainId)
        .map((sd) => sd.id);
      if (subIds.length) {
        const current: string[] = watch('subdomainIds') ?? [];
        setValue('subdomainIds', current.filter((id) => !subIds.includes(id)), { shouldDirty: true });
      }
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {s.intro}
      </p>

      <RHFSearchableChipPicker
        name="domainIds"
        label={s.domainsLabel}
        options={domainOptions}
        placeholder={s.domainsPlaceholder}
        onToggle={handleDomainToggle}
      />

      {subdomainOptions.length > 0 && (
        <RHFSearchableChipPicker
          name="subdomainIds"
          label={s.subdomainsLabel}
          options={subdomainOptions}
          placeholder={s.subdomainsPlaceholder}
        />
      )}
    </div>
  );
};
