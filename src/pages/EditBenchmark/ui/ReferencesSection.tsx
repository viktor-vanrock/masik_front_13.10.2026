import { Plus, Trash2 } from 'lucide-react';
import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextInput } from './TextInput';
import { useApp } from '@/hooks/useApp';

interface Props {
  references: { title: string; url: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: 'title' | 'url', value: string) => void;
}

export const ReferencesSection = ({
  references,
  onAdd,
  onRemove,
  onUpdate,
}: Props) => {
  const { t } = useApp();
  
  return (
    <FormSection title={t.admin.sectionReferences}>
      <div className="space-y-3">
        {references.map((ref, i) => (
          <div
            key={i}
            className="rounded-lg p-3 space-y-2"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} /> {t.admin.removeBtn}
              </button>
            </div>
            <FormField label={t.admin.editBenchmarkLabels.referenceTitle}>
              <TextInput value={ref.title} onChange={(v) => onUpdate(i, 'title', v)} />
            </FormField>
            <FormField label={t.admin.editBenchmarkLabels.referenceUrl}>
              <TextInput value={ref.url} onChange={(v) => onUpdate(i, 'url', v)} />
            </FormField>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <Plus size={13} /> {t.admin.addBtn}
        </button>
      </div>
    </FormSection>
  );
}