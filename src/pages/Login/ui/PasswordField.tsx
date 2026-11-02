import { forwardRef, useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { FIELD_STYLE } from '../consts';
import { useApp } from '@/hooks/useApp';

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'type'> {
  label: string;
  error?: string;
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * forwardRef — чтобы react-hook-form `register()` мог прокинуть ref.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, onFocus, onBlur, visible, onVisibilityChange, ...props }, ref) {
    const { t } = useApp();
    const [localVisible, setLocalVisible] = useState(false);
    const showPassword = visible ?? localVisible;
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            {...props}
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            placeholder={props.placeholder ?? '••••••••'}
            className="w-full pl-9 pr-10 py-3 rounded-xl text-sm transition-colors"
            style={{
              ...FIELD_STYLE,
              borderColor: isFocused ? 'var(--accent)' : 'var(--border)',
            }}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          />
          <button
            type="button"
            onClick={() => {
              setLocalVisible(!showPassword);
              onVisibilityChange?.(!showPassword);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
            aria-label={showPassword ? t.common.aria.hidePassword : t.common.aria.showPassword}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
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
