import { useMemo } from 'react';
import { RHFInput } from './RHFInput';
import { RHFRadioGroup } from './RHFRadioGroup';
import { RHFChipPicker } from './RHFChipPicker';
import { RHFChipToggleGroup } from './RHFChipToggleGroup';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useSettingsAggregateQuery } from '@/api/settings';
import { useApp } from '@/hooks/useApp';
import { pickLocalizedName } from '@/features/catalog/selectors';

export const Step3 = () => {
  const { t, lang } = useApp();
  const s = t.newBenchmark.step3;
  const { data: aggregate } = useSettingsAggregateQuery();

  const taskTypeOptions = useMemo(
    () => (aggregate?.parameters.taskTypes ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const modalityOptions = useMemo(
    () => (aggregate?.parameters.modalities ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const languageOptions = useMemo(
    () => (aggregate?.parameters.languages ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const difficultyOptions = useMemo(
    () => (aggregate?.parameters.difficulties ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  const capabilityOptions = useMemo(
    () => (aggregate?.parameters.capabilities ?? []).map((r) => ({
      value: r.id,
      label: pickLocalizedName(r, lang),
    })),
    [aggregate, lang],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RHFRadioGroup
          name="taskTypeId"
          label={s.taskTypeLabel}
          required
          options={taskTypeOptions}
        />

        <RHFChipPicker
          name="modalityIds"
          label={s.modalityLabel}
          options={modalityOptions}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RHFRadioGroup
          name="languageId"
          label={s.languageLabel}
          required
          options={languageOptions}
        />

        <RHFRadioGroup
          name="difficultyId"
          label={s.difficultyLabel}
          required
          options={difficultyOptions}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RHFInput
          name="sizeInSamples"
          label={s.sizeInSamplesLabel}
          required
          placeholder={s.sizeInSamplesPlaceholder}
          type="number"
        />

        <RHFInput
          name="medianSampleSizeWords"
          label={s.medianWordsLabel}
          placeholder={s.medianWordsPlaceholder}
          type="number"
        />
      </div>

      <SectionDivider label={t.newBenchmark.sections.capabilities} />
      <RHFChipToggleGroup name="capabilityIds" options={capabilityOptions} />
    </div>
  );
};
