import { useMemo } from 'react';
import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { ChipToggle } from './ChipToggle';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

interface Props {
  domainIds: string[];
  subdomainIds: string[];
  onDomainToggle: (id: string) => void;
  onSubdomainToggle: (id: string) => void;
  onSubdomainsChange: (ids: string[]) => void;
}

export const DomainsSection = ({
  domainIds,
  subdomainIds,
  onDomainToggle,
  onSubdomainToggle,
  onSubdomainsChange,
}: Props) => {
  const { t, lang } = useApp();
  const { data: aggregate } = useSettingsAggregateQuery();

  const domainOptions = useMemo(
    () =>
      (aggregate?.domains.domains ?? []).map((r) => ({
        value: r.id,
        label: pickLocalizedName(r, lang),
      })),
    [aggregate, lang],
  );

  const subdomainOptions = useMemo(() => {
    if (!domainIds.length) return [];
    return (aggregate?.domains.subdomains ?? [])
      .filter((sd) => domainIds.includes(sd.domainId))
      .map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }));
  }, [aggregate, domainIds, lang]);

  const handleDomainToggle = (id: string) => {
    const isRemoving = domainIds.includes(id);
    if (isRemoving) {
      const idsToRemove = (aggregate?.domains.subdomains ?? [])
        .filter((sd) => sd.domainId === id)
        .map((sd) => sd.id);
      if (idsToRemove.length) {
        onSubdomainsChange(subdomainIds.filter((sid) => !idsToRemove.includes(sid)));
      }
    }
    onDomainToggle(id);
  };

  return (
    <FormSection title={t.admin.sectionDomains}>
      <FormField label={t.admin.editBenchmarkLabels.domains}>
        <div className="flex flex-wrap gap-2">
          {domainOptions.map(({ value, label }) => (
            <ChipToggle
              key={value}
              label={label}
              active={domainIds.includes(value)}
              onToggle={() => handleDomainToggle(value)}
            />
          ))}
        </div>
      </FormField>

      {subdomainOptions.length > 0 && (
        <FormField label={t.admin.editBenchmarkLabels.subdomains}>
          <div className="flex flex-wrap gap-2">
            {subdomainOptions.map(({ value, label }) => (
              <ChipToggle
                key={value}
                label={label}
                active={subdomainIds.includes(value)}
                onToggle={() => onSubdomainToggle(value)}
              />
            ))}
          </div>
        </FormField>
      )}
    </FormSection>
  );
};
