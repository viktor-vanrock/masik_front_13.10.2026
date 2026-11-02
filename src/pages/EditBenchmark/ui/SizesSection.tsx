import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { NumInput } from './NumInput';
import { useApp } from '@/hooks/useApp';

interface Props {
  sizeInSamples: string;
  medianWords: string;
  reqMin: string;
  reqMedian: string;
  reqMax: string;
  respMin: string;
  respMedian: string;
  respMax: string;
  onSizeChange: (value: string) => void;
  onMedianWordsChange: (value: string) => void;
  onReqMinChange: (value: string) => void;
  onReqMedianChange: (value: string) => void;
  onReqMaxChange: (value: string) => void;
  onRespMinChange: (value: string) => void;
  onRespMedianChange: (value: string) => void;
  onRespMaxChange: (value: string) => void;
}

export const SizesSection = ({
  sizeInSamples,
  medianWords,
  reqMin,
  reqMedian,
  reqMax,
  respMin,
  respMedian,
  respMax,
  onSizeChange,
  onMedianWordsChange,
  onReqMinChange,
  onReqMedianChange,
  onReqMaxChange,
  onRespMinChange,
  onRespMedianChange,
  onRespMaxChange,
}: Props) => {
  const { t } = useApp();
  
  return (
    <FormSection title={t.admin.sectionSizes}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t.admin.editBenchmarkLabels.sizeSamples}>
          <NumInput value={sizeInSamples} onChange={onSizeChange} />
        </FormField>
        <FormField label={t.admin.editBenchmarkLabels.medianWords}>
          <NumInput value={medianWords} onChange={onMedianWordsChange} />
        </FormField>
      </div>

      <p className="text-xs font-medium mt-2 mb-1" style={{ color: 'var(--text-muted)' }}>
        {t.admin.editBenchmarkLabels.requestDist}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <FormField label={t.admin.editBenchmarkLabels.distMin}>
          <NumInput value={reqMin} onChange={onReqMinChange} />
        </FormField>
        <FormField label={t.admin.editBenchmarkLabels.distMedian}>
          <NumInput value={reqMedian} onChange={onReqMedianChange} />
        </FormField>
        <FormField label={t.admin.editBenchmarkLabels.distMax}>
          <NumInput value={reqMax} onChange={onReqMaxChange} />
        </FormField>
      </div>

      <p className="text-xs font-medium mt-3 mb-1" style={{ color: 'var(--text-muted)' }}>
        {t.admin.editBenchmarkLabels.responseDist}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <FormField label={t.admin.editBenchmarkLabels.distMin}>
          <NumInput value={respMin} onChange={onRespMinChange} />
        </FormField>
        <FormField label={t.admin.editBenchmarkLabels.distMedian}>
          <NumInput value={respMedian} onChange={onRespMedianChange} />
        </FormField>
        <FormField label={t.admin.editBenchmarkLabels.distMax}>
          <NumInput value={respMax} onChange={onRespMaxChange} />
        </FormField>
      </div>
    </FormSection>
  );
}