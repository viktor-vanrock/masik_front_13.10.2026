import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AuthProvider } from '@/context/auth';
import { AppProvider } from './context/AppProvider';
import { routes } from './routes/routes.config';

function AppRoutes() {
  return useRoutes(routes);
}

/**
 * Порядок провайдеров:
 *   BrowserRouter        — даёт useNavigate/useLocation для AuthProvider.
 *   AuthProvider         — фундамент auth (user/status/login).
 *   AppProvider          — i18n/theme + проксирует auth наружу.
 *
 * QueryProvider стоит ещё выше — в main.tsx.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
