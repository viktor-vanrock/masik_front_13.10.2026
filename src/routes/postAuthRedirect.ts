import type { User } from '@/types';
import { canAccess } from './access';
import { ROUTES } from './routes.constants';

// The auth provider and the already-authenticated login page must agree on
// the destination: the profile query can resolve before either navigation runs.
export function postAuthRedirect(state: unknown, user: User | null): string {
  const from = (state as { from?: { pathname?: unknown } } | null)?.from?.pathname;
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')
    || from === ROUTES.LOGIN || from === ROUTES.REGISTER) return ROUTES.CATALOGUE;
  return canAccess(from, user) ? from : ROUTES.CATALOGUE;
}
