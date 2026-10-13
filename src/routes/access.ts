// Единый источник прав доступа к роутам (гарды, redirect после login, canAccess).
// Точное совпадение по pathname, для :id-роутов — префикс; неописанный путь = public.

import type { User, UserRole } from '@/types';
import { isAdminRole } from '@/utils/auth/roles';

/** Минимальный уровень доступа к роуту. */
export type RouteAccess =
  | 'public'        // любой, включая гостя
  | 'authenticated' // любой залогиненный
  | 'admin';        // ADMIN или SUPERUSER (см. isAdminRole)

/**
 * Описание прав. Ключи — pathname или префикс (с `/*` в конце для prefix-match).
 * Порядок не важен — берётся самый длинный совпавший ключ.
 */
const ROUTE_ACCESS: Record<string, RouteAccess> = {
  '/login': 'public',
  '/register': 'public',
  '/forbidden': 'public',
  '/profile': 'authenticated',
  '/add-benchmark': 'authenticated',
  '/create': 'authenticated',
  '/admin': 'admin',
  '/admin/*': 'admin',
};

function matchRule(pathname: string): RouteAccess {
  // Точное совпадение приоритетнее префиксного.
  if (pathname in ROUTE_ACCESS) return ROUTE_ACCESS[pathname];

  // Префиксный матч: '/admin/edit/42' → '/admin/*'.
  let bestKey: string | null = null;
  for (const key of Object.keys(ROUTE_ACCESS)) {
    if (!key.endsWith('/*')) continue;
    const prefix = key.slice(0, -2); // '/admin'
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (!bestKey || prefix.length > bestKey.length - 2) bestKey = key;
    }
  }
  if (bestKey) return ROUTE_ACCESS[bestKey];

  return 'public';
}

/** Получить требуемый уровень доступа для pathname. */
export function getRequiredAccess(pathname: string): RouteAccess {
  return matchRule(pathname);
}

/**
 * Может ли пользователь зайти на pathname?
 * `user = null` означает гостя.
 */
export function canAccess(pathname: string, user: User | null): boolean {
  const required = matchRule(pathname);
  if (required === 'public') return true;
  if (!user) return false;
  if (required === 'authenticated') return true;
  return hasRoleAccess(user.role, required);
}

function hasRoleAccess(role: UserRole, required: RouteAccess): boolean {
  if (required === 'admin') return isAdminRole(role);
  return true;
}
