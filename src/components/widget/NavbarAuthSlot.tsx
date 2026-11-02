import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, RotateCw, Shield, User } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

export function NavbarAuthSlot() {
  const { status, user, retry, logout, isLoggingOut } = useAuth();
  const { t, isAdmin } = useApp();
  const location = useLocation();
  const [menuLocation, setMenuLocation] = useState<typeof location | null>(null);
  const menuOpen = menuLocation === location && status === 'authenticated';
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setMenuLocation(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMenuLocation(null);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const moveMenuFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    items[next]?.focus();
  };

  if (status === 'initializing') {
    return <span className="icon-btn nav-login" role="status" aria-label="Проверка сессии" aria-busy="true"><User aria-hidden="true" /></span>;
  }

  if (status === 'error') {
    return <button type="button" onClick={retry} title={t.auth.sessionErrorTitle} className="icon-btn nav-login" aria-label={t.auth.retry}><RotateCw aria-hidden="true" /></button>;
  }

  if (status === 'anonymous') {
    if (location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER) return null;
    return <Link to={ROUTES.LOGIN} state={{ from: location }} className="icon-btn nav-login" aria-label="Войти" title="Войти"><LogIn aria-hidden="true" /></Link>;
  }

  return (
    <div
      className="nav-user"
      ref={containerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuLocation(null);
      }}
    >
      <button
        className="avatar-btn"
        type="button"
        id="userBtn"
        ref={buttonRef}
        aria-haspopup="menu"
        aria-controls={menuOpen ? 'userMenu' : undefined}
        aria-expanded={menuOpen}
        aria-label={`Аккаунт ${user?.username ?? ''}`}
        title={user?.username}
        onClick={() => setMenuLocation(menuOpen ? null : location)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setMenuLocation(location);
          }
        }}
      >
        <i>{user?.username.slice(0, 1).toUpperCase()}</i>
      </button>
      {menuOpen && (
        <div className="menu" id="userMenu" ref={menuRef} role="menu" aria-labelledby="userBtn" onKeyDown={moveMenuFocus}>
          <div className="who"><b>{user?.username}</b>{isAdmin && user ? `${t.roles[user.role]} · ${user.username}` : user?.email}</div>
          <Link role="menuitem" to={ROUTES.PROFILE} onClick={() => setMenuLocation(null)}><User aria-hidden="true" />Личный кабинет</Link>
          {isAdmin && <Link role="menuitem" to={ROUTES.ADMIN} onClick={() => setMenuLocation(null)}><Shield aria-hidden="true" />{t.admin.title}</Link>}
          <button role="menuitem" type="button" id="logoutBtn" disabled={isLoggingOut} onClick={() => { setMenuLocation(null); void logout(); }}><LogOut aria-hidden="true" />{t.nav.logout}</button>
        </div>
      )}
    </div>
  );
}
