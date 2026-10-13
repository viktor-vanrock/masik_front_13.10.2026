import { Outlet } from 'react-router-dom';
import { Navbar } from '../widget/Navbar';
import { Footer } from '../widget/Footer';

interface Props {
  fullHeight?: boolean;
}

export function LayoutWrapper({ fullHeight }: Props) {
  return (
    <div
      className={`flex flex-col min-h-screen`}
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <Navbar />
      <main className={`flex-1 ${fullHeight ? 'flex flex-col' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
