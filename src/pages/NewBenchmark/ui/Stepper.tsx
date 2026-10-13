import { Check } from 'lucide-react';
import { STEPS, getStepTitle } from "../consts";
import { useApp } from '@/hooks/useApp';

interface Props {
    step: number,
    setStep: (s: number) => void
}

export const Stepper = ({step, setStep}: Props) => {
  const { t } = useApp();
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((_key, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              className="flex flex-col items-center gap-1 group w-full"
              style={{ cursor: i < step ? 'pointer' : 'default' }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: i < step ? 'var(--accent)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: i <= step ? '#fff' : 'var(--text-secondary)',
                  border: i === step ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span
                className="hidden sm:block text-xs leading-tight text-center h-8"
                style={{ color: i === step ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              >
                {getStepTitle(t.newBenchmark, i)}
              </span>
            </button>
            {/* Линия под каждым шагом */}
            <div 
              className="w-full h-0.5 mt-2 transition-all duration-300"
              style={{ backgroundColor: i <= step ? 'var(--accent)' : 'var(--border)' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}