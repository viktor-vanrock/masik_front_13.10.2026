interface Props {
  value: string;
  onChange: (v: string) => void;
  name: string;
  placeholder?: string;
  type?: string;
  error?: boolean;
  className?: string;
}

export const Input = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  name,
  className = '',
}: Props) => {
  return (
    <input
      type={type}
      value={value}
      name={name}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg text-sm text-white ${className}`}
      style={{
        backgroundColor: 'var(--bg-page)',
        border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        outline: 'none',
        color: 'var(--text-primary)',
      }}
      onFocus={(e) => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)')}
      onBlur={(e) => (e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)')}
    />
  );
}