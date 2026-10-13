import { LogOut } from 'lucide-react';
import { ROLE_COLORS } from '../constants';
import type { User, UserRole } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  user: User;
  userRole: UserRole | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const UserCard = ({ user, userRole, onLogout, isLoggingOut = false }: Props) => {
  const { t } = useApp();

  return (
    <div
      className="rounded-xl p-6 mb-6 flex items-center gap-5"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' }}
      >
        {user.username.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {user.username}
          </h1>
          {userRole && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: ROLE_COLORS[userRole].bg,
                color: ROLE_COLORS[userRole].color,
              }}
            >
              {(t.roles as Record<string, string>)[userRole] ?? userRole}
            </span>
          )}
        </div>
        {user.email && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {user.email}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <LogOut size={14} />
          {t.nav.logout}
        </button>
      </div>
    </div>
  );
}