// NavbarAuthSlot — auth-секция навбара: скелетон (initializing) · «Войти» (anonymous) ·
// retry (error) · аватар/роль/logout (authenticated).

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowRight, Shield, RotateCw } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { RoleBadge } from '../ui/RoleBadge';
import { ROUTES } from '@/routes/routes.constants';
import { Button } from '@sberai/uikit';

export function NavbarAuthSlot() {
  const { status, user, retry } = useAuth();
  // const { status, user, logout, retry, isLoggingOut } = useAuth(); // Original header logout state kept for re-enabling.
  const { t, isAdmin } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Original header logout handler is retained for re-enabling:
  // const handleLogout = () => {
  //   logout();
  // };

  if (status === 'initializing') {
    return (
      <div className="nex-desktop-auth hidden md:flex items-center gap-2 animate-pulse">
        <div
          className="h-6 w-24 rounded"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
        <div
          className="h-6 w-6 rounded"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
      </div>
    );
  }

  // error ≠ anonymous: сессия неизвестна (network/5xx) — показываем retry, не «Войти».
  if (status === 'error') {
    return (
      <button
        onClick={retry}
        title={t.auth.sessionErrorTitle}
        className="nex-desktop-auth nex-retry-button hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <RotateCw size={14} />
        {t.auth.retry}
      </button>
    );
  }

  if (status === 'anonymous') {
    return (
      <Button
        size="s"
        className="nex-desktop-auth nex-login-btn hidden md:flex"
        rightIcon={<ArrowRight size={14} />}
        onClick={() => navigate(ROUTES.LOGIN, { state: { from: location } })}
      >
        Войти
      </Button>
    );
  }

  /* authenticated */
  return (
    <div className="nex-desktop-auth hidden md:flex items-center gap-1">
      {isAdmin && (
        <Link
          to={ROUTES.ADMIN}
          className="nex-admin-link flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: location.pathname.startsWith(ROUTES.ADMIN)
              ? 'var(--bg-blue-tint)'
              : 'transparent',
            color: location.pathname.startsWith(ROUTES.ADMIN)
              ? 'var(--accent)'
              : 'var(--text-muted)',
          }}
          title={t.admin.title}
        >
          <Shield size={14} />
          <span>{t.nav.adminPanel}</span>
        </Link>
      )}

      <Link
        to={ROUTES.PROFILE}
        className="nex-account-link"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="nex-account-avatar" aria-hidden="true">
          {user?.username?.slice(0, 1).toUpperCase()}
        </span>
        <span className="nex-account-name">{user?.username}</span>
      </Link>

      {/* Header logout control hidden per the NexTest header mockup; retained for re-enabling.
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="nex-logout-button p-1.5 rounded text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ color: 'var(--text-muted)' }}
        title={t.nav.logout}
      >
        <LogOut size={14} />
      </button>
      */}
    </div>
  );
}

/**
 * NavbarAuthSlotMobile — та же логика для мобильного меню.
 */
interface MobileProps {
  onClose: () => void;
}

export function NavbarAuthSlotMobile({ onClose }: MobileProps) {
  const { status, user, logout, retry, isLoggingOut } = useAuth();
  const { t, isAdmin, userRole } = useApp();
  const navigate = useNavigate();

  // logout() всегда завершает сессию локально и уводит на /login — меню закроется само
  // навигацией; отдельно закрывать по клику не нужно.
  const handleLogout = () => {
    logout();
  };

  if (status === 'initializing') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 animate-pulse">
        <div
          className="h-5 w-32 rounded"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={retry}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <RotateCw size={14} />
        {t.auth.retry}
      </button>
    );
  }

  if (status === 'anonymous') {
    return (
      <Button
        size="s"
        className="nex-login-btn"
        rightIcon={<ArrowRight size={14} />}
        onClick={() => {
          onClose();
          navigate(ROUTES.LOGIN);
        }}
      >
        Войти
      </Button>
    );
  }

  return (
    <>
      {isAdmin && (
        <Link
          to={ROUTES.ADMIN}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm"
          style={{ color: 'var(--accent)' }}
        >
          <Shield size={14} />
          {t.admin.title}
        </Link>
      )}
      <Link
        to={ROUTES.PROFILE}
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        <User size={14} />
        <span>{user?.username}</span>
        {userRole && <RoleBadge role={userRole} />}
      </Link>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ color: 'var(--text-muted)' }}
      >
        <LogOut size={14} />
        {t.nav.logout}
      </button>
    </>
  );
}
