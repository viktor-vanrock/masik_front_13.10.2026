import { Link, useLocation } from 'react-router-dom';
import { RotateCw, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { ROUTES } from '@/routes/routes.constants';

export function NavbarAuthSlot() {
  const { status, user, retry } = useAuth();
  const { t } = useApp();
  const location = useLocation();

  if (status === 'initializing') {
    return (
      <div className="flex items-center gap-[9px] animate-pulse">
        <div className="w-[90px] h-3 rounded-md" style={{ backgroundColor: 'var(--bg-elevated)' }} />
        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)' }} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={retry}
        title={t.auth.sessionErrorTitle}
        className="inline-flex min-h-[40px] items-center gap-[7px] border-0 rounded-[20px] px-3.5 py-2 text-xs no-underline"
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
        className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#515dad] rounded-[20px] px-[18px] py-2.5 bg-[#515dad] text-white text-[13px] font-medium no-underline whitespace-nowrap transition-colors duration-150 hover:border-[#465195] hover:bg-[#465195]"
      >
        {t.nav.login}
        <ArrowRight size={14} />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        to={ROUTES.PROFILE}
        className="inline-flex max-w-[190px] items-center gap-[9px] text-[#1e1e20] text-[13px] no-underline"
        aria-label={`Личный кабинет: ${user?.username ?? ''}`}
      >
        <span className="grid w-8 h-8 flex-none place-items-center border border-[#dce0ee] rounded-full bg-[#f3f6fa] text-[#515dad] text-xs font-semibold">
          {user?.username?.slice(0, 1).toUpperCase()}
        </span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{user?.username}</span>
      </Link>
    </div>
  );
}

interface MobileProps {
  onClose: () => void;
}

export function NavbarAuthSlotMobile({ onClose }: MobileProps) {
  const { status, user, retry } = useAuth();
  const { t, isAdmin } = useApp();

  if (status === 'initializing') {
    return (
      <div className="flex min-h-[44px] items-center px-3 animate-pulse">
        <div className="w-[130px] h-3 rounded-md bg-[#e9edf2]" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={retry}
        className="flex min-h-[44px] items-center border-0 rounded-lg px-3 bg-transparent text-sm text-left font-[inherit]"
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
        className="inline-flex self-start min-h-[44px] items-center justify-center gap-2 mt-2 border border-[#515dad] rounded-[20px] px-[18px] py-2.5 bg-[#515dad] text-white text-[13px] font-medium no-underline whitespace-nowrap transition-colors duration-150 hover:border-[#465195] hover:bg-[#465195]"
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
          className="flex min-h-[44px] items-center border-0 rounded-lg px-3 bg-transparent text-sm text-left font-[inherit]"
          style={{ color: 'var(--accent)' }}
        >
          {t.admin.title}
        </Link>
      )}
      <Link
        to={ROUTES.PROFILE}
        onClick={onClose}
        className="flex min-h-[44px] items-center gap-2.5 text-[#1e1e20] no-underline"
      >
        <span className="grid w-8 h-8 flex-none place-items-center border border-[#dce0ee] rounded-full bg-[#f3f6fa] text-[#515dad] text-xs font-semibold">
          {user?.username?.slice(0, 1).toUpperCase()}
        </span>
        <span>{user?.username}</span>
      </Link>
    </>
  );
}
