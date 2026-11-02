import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { useApp } from '@/hooks/useApp';

interface Props {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  metrics: string;
  onNameChange: (value: string) => void;
  onNameEnChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDescriptionEnChange: (value: string) => void;
  onMetricsChange: (value: string) => void;
}

export const BasicInfoSection = ({
  name,
  nameEn,
  description,
  descriptionEn,
  metrics,
  onNameChange,
  onNameEnChange,
  onDescriptionChange,
  onDescriptionEnChange,
  onMetricsChange,
}: Props) => {
  const { t } = useApp();
  
  return (
    <FormSection title={t.admin.sectionBasic}>
      <FormField label={t.admin.editBenchmarkLabels.nameRu}>
        <TextInput value={name} onChange={onNameChange} />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.nameEn}>
        <TextInput value={nameEn} onChange={onNameEnChange} />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.descriptionRu}>
        <TextArea value={description} onChange={onDescriptionChange} rows={3} />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.descriptionEn}>
        <TextArea value={descriptionEn} onChange={onDescriptionEnChange} rows={3} />
      </FormField>
      <FormField label={t.benchmark.metrics}>
        <TextInput value={metrics} onChange={onMetricsChange} placeholder="Accuracy, F1, ..." />
      </FormField>
    </FormSection>
  );
}