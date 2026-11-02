import type { useApp } from "@/hooks/useApp";


interface Props {
  ex: { input: string; output: string; explanation?: string };
  t: ReturnType<typeof useApp>['t'];
}

export function ExampleCard({ ex, t }: Props) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="px-4 py-3" style={{ backgroundColor: 'var(--bg-blue-tint)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t.benchmark.input}</div>
        <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-primary)' }}>{ex.input}</pre>
      </div>
      <div className="px-4 py-3" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t.benchmark.output}</div>
        <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--tag-domain-fg)' }}>{ex.output}</pre>
      </div>
      {ex.explanation && (
        <div className="px-4 py-3" style={{ backgroundColor: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t.benchmark.explanation}</div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ex.explanation}</p>
        </div>
      )}
    </div>
  );
}