import type { User } from '@/types';
import { canAccess } from './access';
import { ROUTES } from './routes.constants';

// The auth provider and the already-authenticated login page must agree on
// the destination: the profile query can resolve before either navigation runs.
export function postAuthRedirect(state: unknown, user: User | null): string {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return ROUTES.HOME;
  const from = (state as { from?: unknown }).from;
  if (!from || typeof from !== 'object' || Array.isArray(from)) return ROUTES.HOME;
  const { pathname, search = '', hash = '' } = from as {
    pathname?: unknown; search?: unknown; hash?: unknown;
  };
  if (typeof pathname !== 'string' || !pathname.startsWith('/')
    || typeof search !== 'string' || (search !== '' && !search.startsWith('?')) || search.includes('#')
    || typeof hash !== 'string' || (hash !== '' && !hash.startsWith('#'))
    || /\p{Cc}/u.test(search + hash)) return ROUTES.HOME;

  let accessPath: string;
  try {
    accessPath = decodeURIComponent(pathname);
  } catch {
    return ROUTES.HOME;
  }
  if (accessPath.startsWith('//') || /[\p{Cc}\s\\?#]/u.test(accessPath)
    || accessPath.split('/').some(segment => segment === '.' || segment === '..')) return ROUTES.HOME;
  // React Router matches decoded paths without case or trailing-slash sensitivity.
  accessPath = accessPath.toLowerCase().replace(/\/+$/, '') || '/';
  if (accessPath === ROUTES.LOGIN || accessPath === ROUTES.REGISTER
    || !canAccess(accessPath, user)) return ROUTES.HOME;
  return pathname + search + hash;
}
