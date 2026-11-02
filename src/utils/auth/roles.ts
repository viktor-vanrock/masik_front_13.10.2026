import type { UserRole } from '@/types';

export const isAdminRole = (role: UserRole | null | undefined): boolean =>
  role === 'ADMIN' || role === 'SUPERUSER';

export const isSuperUserRole = (role: UserRole | null | undefined): boolean =>
  role === 'SUPERUSER';
