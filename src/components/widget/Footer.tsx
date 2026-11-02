import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.constants';
import { NexTestLogo } from './Navbar';
import { CreateBenchmarkLink } from '@/components/ui/CreateBenchmarkLink';

export function Footer() {
  return (
    <div className="bf-theme" style={{ display: 'contents' }}>
      <footer>
        <div className="wrap">
          <Link className="logo" to={ROUTES.HOME} style={{ fontSize: 17 }} aria-label="BenchFactory — на главную">
            <NexTestLogo />
            <span className="logo-word">BenchFactory</span>
          </Link>
          <span>Мультиагентная система создания бенчмарков · демонстрационный стенд</span>
          <nav aria-label="Ссылки в подвале">
            <Link to="/catalog">Каталог</Link>
            <CreateBenchmarkLink>Создать бенчмарк</CreateBenchmarkLink>
          </nav>
        </div>
      </footer>
    </div>
  );
}
