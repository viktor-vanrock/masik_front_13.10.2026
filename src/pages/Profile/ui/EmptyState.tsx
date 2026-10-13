import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useApp } from '@/hooks/useApp';


export const EmptyState = () => {
  const { t } = useApp();
  
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-xl"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <MessageSquare size={40} style={{ color: 'var(--icon-empty)' }} className="mb-4" />
      <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
        {t.profile.emptyDialogues}
      </p>
      <Link
        to="/create"
        className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {t.profile.newBenchmark}
      </Link>
    </div>
  );
}