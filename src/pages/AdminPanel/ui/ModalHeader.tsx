import { X } from 'lucide-react';
import type { Lang } from '@/i18n';
import { formatLocaleDate } from '@/utils/format/date';

interface ModalHeaderProps {
  benchmark: {
    name: string;
    nameEn: string;
    jiraTicketId?: string;
    isGenerated?: boolean;
    generatedAt?: string;
  };
  lang: Lang;
  onClose: () => void;
}

export function ModalHeader({ benchmark, lang, onClose }: ModalHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="min-w-0 flex-1 mr-4">
        <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {lang === 'en' ? benchmark.nameEn : benchmark.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {benchmark.jiraTicketId && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--bg-blue-tint)', 
                color: 'var(--accent)', 
                border: '1px solid var(--border)' 
              }}
            >
              {benchmark.jiraTicketId}
            </span>
          )}
          {benchmark.isGenerated && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded" 
              style={{ 
                backgroundColor: 'var(--bg-elevated)', 
                color: 'var(--text-muted)', 
                border: '1px solid var(--border)' 
              }}
            >
              AI-generated
            </span>
          )}
          {benchmark.generatedAt && (
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {formatLocaleDate(lang, benchmark.generatedAt)}
            </span>
          )}
        </div>
      </div>
      <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
        <X size={18} />
      </button>
    </div>
  );
}