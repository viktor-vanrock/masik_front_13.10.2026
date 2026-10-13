import { inputStyle } from '../styles';

interface NumInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function NumInput({ value, onChange }: NumInputProps) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-sm"
      style={inputStyle}
      onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
      onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
    />
  );
}