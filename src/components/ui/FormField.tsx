const FIELD_CLASS = 'w-full rounded-lg px-3 py-2 text-sm';

const FIELD_STYLE = {
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  outline: 'none',
};

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  rows?: number;
  placeholder?: string;
}

export const FormField = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  rows,
  placeholder 
}: Props) => {
  const isTextarea = !!rows;
  const className = `${FIELD_CLASS}${isTextarea ? ' resize-none' : ''}`;

  return (
    <div>
      <label 
        className="block text-xs mb-1 font-medium" 
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={className}
          style={FIELD_STYLE}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          style={FIELD_STYLE}
        />
      )}
    </div>
  );
}