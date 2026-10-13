import { useFormContext, useFieldArray } from 'react-hook-form';
import { RHFInput } from "./RHFInput";
import { RHFTextarea } from "./RHFTextarea";
import { Trash2, Plus } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

export const Step5 = () => {
  const { t } = useApp();
  const s = t.newBenchmark.step5;
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'examples',
  });

  const addExample = () => {
    append({ input: '', output: '', explanation: '' });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {s.intro}
      </p>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {s.exampleTitle.replace('{n}', String(index + 1))}
            </span>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Trash2 size={11} />
                {s.removeBtn}
              </button>
            )}
          </div>

          <RHFTextarea
            name={`examples.${index}.input`}
            label={s.inputLabel}
            placeholder={s.inputPlaceholder}
            rows={3}
          />

          <RHFInput
            name={`examples.${index}.output`}
            label={s.outputLabel}
            placeholder={s.outputPlaceholder}
          />

          <RHFInput
            name={`examples.${index}.explanation`}
            label={s.explanationLabel}
            placeholder={s.explanationPlaceholder}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addExample}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors hover:opacity-80"
        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <Plus size={14} />
        {s.addBtn}
      </button>
    </div>
  );
};
