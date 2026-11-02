import { useMemo } from 'react';
import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { SelectInput } from './SelectInput';
import { ChipToggle } from './ChipToggle';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

interface Props {
  taskTypeId: string;
  modalityIds: string[];
  languageId: string;
  difficultyId: string;
  capabilityIds: string[];
  onTaskTypeChange: (id: string) => void;
  onModalityToggle: (id: string) => void;
  onLanguageChange: (id: string) => void;
  onDifficultyChange: (id: string) => void;
  onCapabilityToggle: (id: string) => void;
}

export const ParametersSection = ({
  taskTypeId,
  modalityIds,
  languageId,
  difficultyId,
  capabilityIds,
  onTaskTypeChange,
  onModalityToggle,
  onLanguageChange,
  onDifficultyChange,
  onCapabilityToggle,
}: Props) => {
  const { t, lang } = useApp();
  const { data: aggregate } = useSettingsAggregateQuery();

  const taskTypeOptions = useMemo(
    () => [{ value: '', label: '—' }, ...(aggregate?.parameters.taskTypes ?? []).map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }))],
    [aggregate, lang],
  );
  const modalityOptions = useMemo(
    () => (aggregate?.parameters.modalities ?? []).map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) })),
    [aggregate, lang],
  );
  const languageOptions = useMemo(
    () => [{ value: '', label: '—' }, ...(aggregate?.parameters.languages ?? []).map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }))],
    [aggregate, lang],
  );
  const difficultyOptions = useMemo(
    () => [{ value: '', label: '—' }, ...(aggregate?.parameters.difficulties ?? []).map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) }))],
    [aggregate, lang],
  );
  const capabilityOptions = useMemo(
    () => (aggregate?.parameters.capabilities ?? []).map((r) => ({ value: r.id, label: pickLocalizedName(r, lang) })),
    [aggregate, lang],
  );

  return (
    <FormSection title={t.admin.sectionParams}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.benchmark.taskType}>
          <SelectInput value={taskTypeId} onChange={onTaskTypeChange} options={taskTypeOptions} />
        </FormField>
        <FormField label={t.benchmark.language}>
          <SelectInput value={languageId} onChange={onLanguageChange} options={languageOptions} />
        </FormField>
        <FormField label={t.benchmark.difficulty}>
          <SelectInput value={difficultyId} onChange={onDifficultyChange} options={difficultyOptions} />
        </FormField>
      </div>

      {modalityOptions.length > 0 && (
        <FormField label={t.benchmark.modality}>
          <div className="flex flex-wrap gap-2">
            {modalityOptions.map(({ value, label }) => (
              <ChipToggle
                key={value}
                label={label}
                active={modalityIds.includes(value)}
                onToggle={() => onModalityToggle(value)}
              />
            ))}
          </div>
        </FormField>
      )}

      {capabilityOptions.length > 0 && (
        <FormField label={t.catalogue.capabilitiesSection}>
          <div className="flex flex-wrap gap-2">
            {capabilityOptions.map(({ value, label }) => (
              <ChipToggle
                key={value}
                label={label}
                active={capabilityIds.includes(value)}
                onToggle={() => onCapabilityToggle(value)}
              />
            ))}
          </div>
        </FormField>
      )}
    </FormSection>
  );
};
