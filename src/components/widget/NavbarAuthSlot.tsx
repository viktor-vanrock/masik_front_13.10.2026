// NavbarAuthSlot — auth-секция навбара: скелетон (initializing) · «Войти» (anonymous) ·
// retry (error) · аватар/роль/logout (authenticated).

import { Link, useLocation } from 'react-router-dom';
import { RotateCw, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

export function NavbarAuthSlot() {
  const { status, user, retry } = useAuth();
  const { t, isAdmin } = useApp();
  const location = useLocation();

  if (status === 'initializing') {
    return (
      <div className="nex-navbar__skeleton animate-pulse">
        <div
          className="nex-navbar__skeleton-name"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
        <div
          className="nex-navbar__skeleton-avatar"
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
        className="nex-navbar__retry"
        style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <RotateCw size={14} />
        {t.auth.retry}
      </button>
    );
  }

  if (status === 'anonymous') {
    return (
      <Link
        to={ROUTES.LOGIN}
        state={{ from: location }}
        className="nex-navbar__login"
      >
        {t.nav.login}
        <ArrowRight size={14} />
      </Link>
    );
  }

  /* authenticated */
  return (
    <div className="nex-navbar__authenticated">
      {isAdmin && (
        <Link
          to={ROUTES.ADMIN}
          className="nex-navbar__admin"
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
          <span>{t.nav.adminPanel}</span>
        </Link>
      )}

      <Link
        to={ROUTES.PROFILE}
        className="nex-navbar__user"
        aria-label={`Личный кабинет: ${user?.username ?? ''}`}
      >
        <span className="nex-navbar__avatar">{user?.username?.slice(0, 1).toUpperCase()}</span>
        <span className="nex-navbar__username">{user?.username}</span>
      </Link>

      {/* Logout remains available from the profile; header keeps only the account name. */}
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
  const { status, user, retry } = useAuth();
  const { t, isAdmin } = useApp();

  if (status === 'initializing') {
    return (
      <div className="nex-navbar__mobile-skeleton animate-pulse">
        <div />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={retry}
        className="nex-navbar__mobile-retry"
        style={{ color: 'var(--text-muted)' }}
      >
        <RotateCw size={14} />
        {t.auth.retry}
      </button>
    );
  }

  if (status === 'anonymous') {
    return (
      <Link
        to={ROUTES.LOGIN}
        onClick={onClose}
        className="nex-navbar__login"
      >
        {t.nav.login}
        <ArrowRight size={14} />
      </Link>
    );
  }

  return (
    <>
      {isAdmin && (
        <Link
          to={ROUTES.ADMIN}
          onClick={onClose}
          className="nex-navbar__mobile-admin"
          style={{ color: 'var(--accent)' }}
        >
          {t.admin.title}
        </Link>
      )}
      <Link
        to={ROUTES.PROFILE}
        onClick={onClose}
        className="nex-navbar__mobile-user"
      >
        <span className="nex-navbar__avatar">{user?.username?.slice(0, 1).toUpperCase()}</span>
        <span>{user?.username}</span>
      </Link>
    </>
  );
}
