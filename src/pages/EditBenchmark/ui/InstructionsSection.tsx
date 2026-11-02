import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextArea } from './TextArea';
import { useApp } from '@/hooks/useApp';

interface Props {
  instructions: string;
  instructionsEn: string;
  onInstructionsChange: (value: string) => void;
  onInstructionsEnChange: (value: string) => void;
}

export const InstructionsSection = ({
  instructions,
  instructionsEn,
  onInstructionsChange,
  onInstructionsEnChange,
}: Props) => {
  const { t } = useApp();
  
  return (
    <FormSection title={t.admin.sectionInstructions}>
      <FormField label={t.admin.editBenchmarkLabels.instructionsRu}>
        <TextArea value={instructions} onChange={onInstructionsChange} rows={4} />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.instructionsEn}>
        <TextArea value={instructionsEn} onChange={onInstructionsEnChange} rows={4} />
      </FormField>
    </FormSection>
  );
}