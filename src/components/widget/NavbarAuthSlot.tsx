// NavbarAuthSlot — auth-секция навбара: скелетон (initializing) · «Войти» (anonymous) ·
// retry (error) · аватар/роль/logout (authenticated).

import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, LogIn, Shield, RotateCw } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { RoleBadge } from '../ui/RoleBadge';
import { ROUTES } from '@/routes/routes.constants';

export function NavbarAuthSlot() {
  const { status, user, logout, retry, isLoggingOut } = useAuth();
  const { t, isAdmin, userRole } = useApp();
  const location = useLocation();

  // logout() всегда завершает сессию локально (успех/ошибка/timeout — не важно) и уводит
  // на /login; disabled только на время ограниченного (≤6с) ожидания ответа сервера.
  const handleLogout = () => {
    logout();
  };

  if (status === 'initializing') {
    return (
      <div className="hidden md:flex items-center gap-2 animate-pulse">
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
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
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
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <LogIn size={14} />
        {t.nav.login}
      </Link>
    );
  }

  /* authenticated */
  return (
    <div className="hidden md:flex items-center gap-1">
      {isAdmin && (
        <Link
          to={ROUTES.ADMIN}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors"
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <User size={14} />
        <span className="max-w-[100px] truncate">{user?.username}</span>
        {userRole && <RoleBadge role={userRole} />}
      </Link>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="p-1.5 rounded text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ color: 'var(--text-muted)' }}
        title={t.nav.logout}
      >
        <LogOut size={14} />
      </button>
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
      <Link
        to={ROUTES.LOGIN}
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm text-white"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        <LogIn size={14} />
        {t.nav.login}
      </Link>
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
