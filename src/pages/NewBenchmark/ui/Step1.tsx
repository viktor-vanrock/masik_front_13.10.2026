import { RHFInput } from "./RHFInput";
import { RHFTextarea } from "./RHFTextarea";
import { RHFSuiteSelect } from "./RHFSuiteSelect";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { useApp } from '@/hooks/useApp';

export const Step1 = () => {
  const { t } = useApp();
  const s = t.newBenchmark.step1;
  const sections = t.newBenchmark.sections;
  const labels = t.admin.editBenchmarkLabels;

  return (
    <div className="space-y-5">
      <RHFSuiteSelect name="suiteId" required />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RHFInput
          name="name"
          label={labels.nameRu}
          required
          placeholder={s.namePlaceholder}
        />
        <RHFInput
          name="nameEn"
          label={labels.nameEn}
          required
          placeholder={s.nameEnPlaceholder}
        />
      </div>

      <RHFTextarea
        name="description"
        label={labels.descriptionRu}
        required
        placeholder={s.descriptionPlaceholder}
        rows={3}
      />

      <RHFTextarea
        name="descriptionEn"
        label={labels.descriptionEn}
        placeholder={s.descriptionEnPlaceholder}
        rows={3}
      />

      <SectionDivider label={sections.links} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RHFInput name="codebaseName" label={s.codebaseNameLabel} placeholder={s.codebaseNamePlaceholder} />
        <RHFInput name="codebaseUrl" label={s.codebaseUrlLabel} placeholder={s.codebaseUrlPlaceholder} />
        <RHFInput name="paperTitle" label={s.paperTitleLabel} placeholder={s.paperTitlePlaceholder} />
        <RHFInput name="paperUrl" label={s.paperUrlLabel} placeholder={s.paperUrlPlaceholder} />
      </div>

      <SectionDivider label={sections.additional} />

      <RHFInput name="metrics" label={s.metricsLabel} placeholder={s.metricsPlaceholder} />

      <RHFTextarea
        name="instructions"
        label={s.instructionsLabel}
        placeholder={s.instructionsPlaceholder}
        rows={3}
      />

      <RHFTextarea
        name="instructionsEn"
        label={s.instructionsEnLabel}
        placeholder={s.instructionsEnPlaceholder}
        rows={3}
      />

      <SectionDivider label={sections.gigametricOptional} />

      <RHFInput name="gigaMetricAdapterName" label={s.adapterNameLabel} placeholder={s.adapterNamePlaceholder} />
      <RHFInput name="gigaMetricSetUrl" label={s.adapterSetUrlLabel} placeholder={s.adapterSetUrlPlaceholder} />

      <RHFTextarea
        name="gigaMetricLaunchCommand"
        label={s.launchCommandLabel}
        placeholder={s.launchCommandPlaceholder}
        rows={3}
      />
    </div>
  );
};
