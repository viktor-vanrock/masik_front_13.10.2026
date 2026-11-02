import { Plus, Trash2 } from 'lucide-react';
import { FormSection } from '../ui/FormSection';
import { FormField } from '../ui/FormField';
import { TextArea } from './TextArea';
import { useApp } from '@/hooks/useApp';
import type { BenchmarkExample } from '@/types';

interface Props {
  examples: BenchmarkExample[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof BenchmarkExample, value: string) => void;
}

export const ExamplesSection = ({
  examples,
  onAdd,
  onRemove,
  onUpdate,
}: Props) => {
  const { t } = useApp();
  return (
    <FormSection title={t.admin.sectionExamples}>
      <div className="space-y-3">
        {examples.map((ex, i) => (
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
            <FormField label={t.admin.editBenchmarkLabels.exampleInput}>
              <TextArea value={ex.input} onChange={(v) => onUpdate(i, 'input', v)} rows={2} />
            </FormField>
            <FormField label={t.admin.editBenchmarkLabels.exampleOutput}>
              <TextArea value={ex.output} onChange={(v) => onUpdate(i, 'output', v)} rows={2} />
            </FormField>
            <FormField label={t.admin.editBenchmarkLabels.exampleExplanation}>
              <TextArea
                value={ex.explanation ?? ''}
                onChange={(v) => onUpdate(i, 'explanation', v)}
                rows={2}
              />
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