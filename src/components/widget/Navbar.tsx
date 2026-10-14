import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/routes/routes.constants';
import { NavbarAuthSlot, NavbarAuthSlotMobile } from './NavbarAuthSlot';
import './Navbar.css';

const navLinks = [
  { to: ROUTES.DASHBOARD, label: 'Лидерборд' },
  { to: ROUTES.HOME, label: 'Каталог' },
  { to: ROUTES.CREATE, label: 'Создать бенчмарк' },
] as const;

function NexTestLogo() {
  return (
    <svg className="nex-navbar__logo" viewBox="0 0 592 144" fill="none" aria-hidden="true">
      <g fill="#202431">
        <path d="M20 120V20H39L83 89V20H102V120H83L39 51V120Z" />
        <path fillRule="evenodd" d="M186 89H135C136 102 143 108 154 108C163 108 169 105 175 100L185 112C177 119 167 123 154 123C130 123 115 108 115 84C115 61 130 46 152 46C174 46 187 61 187 84C187 86 187 88 186 89ZM135 76H168C167 65 162 60 152 60C143 60 137 65 135 76Z" />
        <path d="M294 20H376V38H345V120H325V38H294Z" />
        <path fillRule="evenodd" d="M447 89H396C397 102 404 108 415 108C424 108 430 105 436 100L446 112C438 119 428 123 415 123C391 123 376 108 376 84C376 61 391 46 413 46C435 46 448 61 448 84C448 86 448 88 447 89ZM396 76H429C428 65 423 60 413 60C404 60 398 65 396 76Z" />
        <path d="M512 53L505 67C498 63 491 61 484 61C477 61 473 63 473 68C473 72 477 74 487 76C505 80 514 86 514 99C514 114 502 123 483 123C471 123 459 119 451 113L459 99C466 104 475 108 483 108C491 108 496 105 496 101C496 97 492 95 481 92C463 88 455 82 455 69C455 55 466 46 485 46C495 46 505 49 512 53Z" />
        <path d="M532 29H551V48H570V63H551V96C551 104 554 107 560 107C564 107 567 106 570 105V120C565 122 560 123 555 123C540 123 532 115 532 100V63H521V48H532Z" />
      </g>
      <g>
        <path fill="#4169E8" d="M196 48H219L241 77L230 82Z" />
        <path fill="#4169E8" d="M245 91L256 86L290 120H267Z" />
        <path fill="#8054D9" d="M267 48H290L256 82L245 77Z" />
        <path fill="#8054D9" d="M230 86L241 91L219 120H196Z" />
      </g>
    </svg>
  );
}

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Переключатели языка и темы временно скрыты, исходная логика сохранена в git-истории.

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === ROUTES.HOME
      ? location.pathname === ROUTES.HOME
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="nex-navbar">
      <div className="nex-navbar__inner">
        <Link to={ROUTES.HOME} className="nex-navbar__brand" aria-label="NexTest — главная">
          <NexTestLogo />
        </Link>

        <nav className="nex-navbar__links" aria-label="Основная навигация">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={isActive(to) ? 'is-active' : undefined} aria-current={isActive(to) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
          <button type="button" className="nex-navbar__inert-link">Оценить модель</button>
          {/* Гайд и FAQ временно скрыт; ссылка сохранена для быстрого возврата.
          <Link to={ROUTES.GUIDE} className={isActive(ROUTES.GUIDE) ? 'is-active' : undefined} aria-current={isActive(ROUTES.GUIDE) ? 'page' : undefined}>
            Гайд и FAQ
          </Link>
          */}
        </nav>

        <div className="nex-navbar__actions">
          <NavbarAuthSlot />
          <button
            type="button"
            className="nex-navbar__mobile-toggle"
            aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="nex-navbar__mobile-menu" aria-label="Мобильная навигация">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} className={isActive(to) ? 'is-active' : undefined}>
              {label}
            </Link>
          ))}
          <button type="button" className="nex-navbar__inert-link">Оценить модель</button>
          {/* Гайд и FAQ временно скрыт; ссылка сохранена для быстрого возврата.
          <Link to={ROUTES.GUIDE} onClick={() => setMobileOpen(false)} className={isActive(ROUTES.GUIDE) ? 'is-active' : undefined}>
            Гайд и FAQ
          </Link>
          */}
          <NavbarAuthSlotMobile onClose={() => setMobileOpen(false)} />
        </nav>
      )}
    </header>
  );
}
