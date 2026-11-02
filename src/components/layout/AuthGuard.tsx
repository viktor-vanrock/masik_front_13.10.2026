import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.constants';
import { useAuth } from '@/context/auth';
import { AuthBootstrapError } from './AuthBootstrapError';

// AuthGuard — пропускает только authenticated. initializing → null (ждём bootstrap),
// error → retry, anonymous → редирект на /login (с сохранением from).
export function AuthGuard() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'initializing') return null;

  if (status === 'error') return <AuthBootstrapError onRetry={retry} />;

  if (status === 'anonymous') {
    return (
      <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    );
  }

  return <Outlet />;
}
