import { matchPath, Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { Navbar } from '../widget/Navbar';
import { Footer } from '../widget/Footer';
import '@/pages/Landing/landing.css';
import '@/styles/benchfactory-app.css';
import '@/styles/benchfactory-chat.css';

interface Props {
  fullHeight?: boolean;
}

export function LayoutWrapper({ fullHeight }: Props) {
  const { pathname, hash } = useLocation();
  const isReferencePage = pathname === '/' || pathname === '/catalog' || pathname.startsWith('/benchmark/') || Boolean(matchPath('/create', pathname));
  const isCreate = Boolean(matchPath('/create', pathname));

  useLayoutEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return (
    <div
      className={`flex flex-col min-h-screen`}
      style={{ backgroundColor: isReferencePage ? '#10121b' : 'var(--bg-page)' }}
    >
      <Navbar />
      <main className={`flex-1 ${fullHeight ? 'flex flex-col' : ''}`}>
        <Outlet />
      </main>
      {!isCreate && <Footer />}
    </div>
  );
}
