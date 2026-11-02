import { Link, matchPath, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { ROUTES } from '@/routes/routes.constants';
import { NavbarAuthSlot } from './NavbarAuthSlot';
import { CreateBenchmarkLink } from '@/components/ui/CreateBenchmarkLink';

export function NexTestLogo() {
  return (
    <svg viewBox="15 3 44 58" aria-hidden="true">
      <path d="M18 32V21q0-3 3-4L41 7c12-5 17 12 6 18L18 39Z" />
      <path d="M18 45q0-3 3-5l20-10c12-5 17 12 6 18L23 59q-5 2-5-5Z" />
    </svg>
  );
}

export function Navbar() {
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const catalogActive = pathname === '/catalog' || pathname.startsWith('/benchmark/');

  useEffect(() => {
    const updateScroll = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 8);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <div className="bf-theme" style={{ display: 'contents' }}>
      <header className="nav" id="nav" ref={navRef}>
        <div className="wrap">
          <Link className="logo" to={ROUTES.HOME} aria-label="BenchFactory — на главную">
            <NexTestLogo />
            <span className="logo-word">BenchFactory</span>
          </Link>
          <nav className="nav-tabs" aria-label="Основная навигация">
            <Link to={ROUTES.HOME} data-tab="home" aria-current={pathname === ROUTES.HOME ? 'page' : undefined}>Главная</Link>
            <Link to="/catalog" data-tab="catalog" aria-current={catalogActive ? 'page' : undefined}>Каталог</Link>
          </nav>
          <div className="nav-actions">
            <CreateBenchmarkLink className="btn btn-primary btn-sm btn-create" id="navCreate" hidden={Boolean(matchPath(ROUTES.CREATE, pathname))}>
              <span className="full">Создать бенчмарк</span>
              <span className="short">Создать</span>
            </CreateBenchmarkLink>
            <span id="navUser"><NavbarAuthSlot /></span>
          </div>
        </div>
      </header>
    </div>
  );
}
