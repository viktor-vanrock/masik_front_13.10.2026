import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextInput } from './TextInput';
import { useApp } from '@/hooks/useApp';

interface Props {
  codebaseName: string;
  codebaseUrl: string;
  onNameChange: (value: string) => void;
  onUrlChange: (value: string) => void;
}

export const CodebaseSection = ({
  codebaseName,
  codebaseUrl,
  onNameChange,
  onUrlChange,
}: Props) => {
  const { t } = useApp();

  return (
    <FormSection title={t.admin.sectionCodebase}>
      <FormField label={t.admin.editBenchmarkLabels.codebaseName}>
        <TextInput value={codebaseName} onChange={onNameChange} placeholder="my-benchmark" />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.codebaseUrl}>
        <TextInput value={codebaseUrl} onChange={onUrlChange} placeholder="https://gitverse.ru/..." />
      </FormField>
    </FormSection>
  );
}