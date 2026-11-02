import { inputStyle } from '../styles';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextArea({ value, onChange, rows = 3, placeholder }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm resize-y"
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  );
}