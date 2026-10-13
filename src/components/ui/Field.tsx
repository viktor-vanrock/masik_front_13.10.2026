import type {ReactNode} from 'react';
import type { FieldError } from 'react-hook-form';

interface Props {
  label: string;
  required?: boolean;
  error?: string | FieldError;
  children: ReactNode;
  htmlFor?: string;
}

export const Field = ({
  label='',
  required,
  error,
  children,
  htmlFor,
}: Props) => {
  
  const errorMessage = (() => {
    if (!error) return undefined;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && 'message' in error && error.message) {
      return String(error.message); // принудительно в строку
    }
    return undefined;
  })();
      
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium mb-1.5"
        style={{ color: 'var(--text-secondary)'
        }}>
        {label}
        {required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
      {errorMessage && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
