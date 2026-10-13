import type { StructuredPrompt } from '@/types';
import { useState } from 'react';
import type { CreateTranslations } from '../types';

interface Props {
  prompt: StructuredPrompt;
  interview: CreateTranslations['interview'];
  onPick: (text: string) => void;
  disabled: boolean;
}

export const StructuredPromptBlock = ({
  prompt,
  interview,
  onPick,
  disabled,
}: Props) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const pickOption = (value: string, label: string) => {
    if (value === '__custom__') {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    setCustomVal('');
    onPick(label);
  };

  const confirmCustom = () => {
    const n = customVal.trim();
    if (!n || !/^\d+$/.test(n)) return;
    setCustomOpen(false);
    setCustomVal('');
    onPick(n);
  };

  if (prompt.kind === 'single') {
    return (
      <div className="flex flex-col gap-1.5 w-full min-w-[220px]">
        {prompt.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => pickOption(opt.value, opt.label)}
            className="text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (prompt.kind === 'boolean') {
    return (
      <div className="flex flex-wrap gap-2 w-full">
        {prompt.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => pickOption(opt.value, opt.label)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex-1 min-w-[100px]"
            style={{
              backgroundColor: 'var(--bg-blue-tint)',
              color: 'var(--text-blue-on-bg)',
              border: '1px solid var(--border)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-wrap gap-2">
        {prompt.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => pickOption(opt.value, opt.label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              opt.value === '__custom__' && customOpen ? 'ring-2 ring-offset-1 ring-[color:var(--accent)]' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {customOpen && (
        <div
          className="flex flex-wrap items-end gap-2 p-2 rounded-xl"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value.replace(/\D/g, ''))}
            placeholder={interview.enterNumber}
            disabled={disabled}
            className="flex-1 min-w-[120px] text-sm px-2 py-1.5 rounded-lg bg-transparent outline-none"
            style={{
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            disabled={disabled || !customVal.trim()}
            onClick={() => void confirmCustom()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#fff',
            }}
          >
            {interview.confirmCustom}
          </button>
        </div>
      )}
    </div>
  );
}