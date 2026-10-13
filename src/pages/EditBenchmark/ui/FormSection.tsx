interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h2
        className="text-sm font-semibold mb-4 pb-3"
        style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}