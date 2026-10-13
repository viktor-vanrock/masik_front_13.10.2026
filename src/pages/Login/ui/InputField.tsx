import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { FIELD_STYLE } from '../consts';

interface InputFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label: string;
  icon: LucideIcon;
  error?: string;
}

/** forwardRef — чтобы react-hook-form `register()` мог прокинуть ref. */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField({ label, icon: Icon, error, onFocus, onBlur, ...props }, ref) {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        <div className="relative">
          <Icon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            {...props}
            ref={ref}
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm transition-colors"
            style={{
              ...FIELD_STYLE,
              borderColor: isFocused ? 'var(--accent)' : 'var(--border)',
            }}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          />
        </div>
        {error && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
