import { Link } from 'react-router-dom';
import { PlusCircle, MessageSquarePlus } from 'lucide-react';
import { ROUTES } from '@/routes/routes.constants';
import { useApp } from '@/hooks/useApp';
import { Button } from '@sberai/uikit';

export const Header = () => {
  const { t, isAuthenticated, canAddBenchmark } = useApp();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-primary">
          {t.catalogue.title}
        </h1>
        <p className="text-sm mt-0.5 text-muted">
          {t.catalogue.subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
        <Link to={ROUTES.CREATE}>
          <Button variant="outline" size='sm' style={{ borderRadius: '8px', cursor: 'pointer'}}>
            <MessageSquarePlus size={15} />
            {t.catalogue.recommendCta}
          </Button>
        </Link>
        {isAuthenticated && canAddBenchmark && (
          <Link to={ROUTES.ADD_BENCHMARK}>
            <Button
              variant='secondary'
              className='text-white cursor-pointer '
              style={{ backgroundColor: 'var(--accent)', borderRadius: '8px'}}
              size='sm'
            >
              <PlusCircle size={15} />
              {t.catalogue.createCta}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}