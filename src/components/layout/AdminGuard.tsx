import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.constants';
import { useAuth } from '@/context/auth';
import { isAdminRole } from '@/utils/auth/roles';
import { AuthBootstrapError } from './AuthBootstrapError';

// AdminGuard — только ADMIN/SUPERUSER. initializing→null · error→retry · anonymous→/login ·
// authenticated без прав→/forbidden. Читаем useAuth напрямую (isAdmin из AppContext может отставать).
export function AdminGuard() {
  const { status, user, retry } = useAuth();
  const location = useLocation();

  if (status === 'initializing') return null;

  if (status === 'error') return <AuthBootstrapError onRetry={retry} />;

  if (status === 'anonymous') {
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    );
  }

  if (!isAdminRole(user?.role)) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <Outlet />;
}
