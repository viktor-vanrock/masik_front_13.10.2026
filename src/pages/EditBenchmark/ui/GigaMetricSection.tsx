import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { useApp } from '@/hooks/useApp';


interface Props {
  adapterName: string;
  adapterSetUrl: string;
  launchCommand: string;
  onAdapterNameChange: (value: string) => void;
  onAdapterSetUrlChange: (value: string) => void;
  onLaunchCommandChange: (value: string) => void;
}

export const GigaMetricSection = ({
  adapterName,
  adapterSetUrl,
  launchCommand,
  onAdapterNameChange,
  onAdapterSetUrlChange,
  onLaunchCommandChange,
}: Props) => {
  const { t } = useApp();
  
  return (
    <FormSection title={t.admin.sectionGigametric}>
      <FormField label={t.admin.editBenchmarkLabels.adapterName}>
        <TextInput
          value={adapterName}
          onChange={onAdapterNameChange}
          placeholder="my-bench-adapter"
        />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.adapterSetUrl}>
        <TextInput
          value={adapterSetUrl}
          onChange={onAdapterSetUrlChange}
          placeholder="https://gitverse.ru/..."
        />
      </FormField>
      <FormField label={t.admin.editBenchmarkLabels.launchCommand}>
        <TextArea value={launchCommand} onChange={onLaunchCommandChange} rows={3} />
      </FormField>
    </FormSection>
  );
}