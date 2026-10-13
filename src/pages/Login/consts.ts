/**
 * Демо-аккаунты для разработки.
 * AUTH_LEGACY: убрать когда будет реальный бэк с тестовыми аккаунтами.
 */
import type { UserRole } from '@/types';

export const ROLE_PILL_COLORS: Record<UserRole, { bg: string; color: string }> = {
  SUPERUSER: { bg: '#FEF3C7', color: '#92400E' },
  ADMIN:     { bg: '#ECFDF5', color: '#065F46' },
  USER:      { bg: '#F3F4F6', color: '#6B7280' },
};

export const FIELD_STYLE = {
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  outline: 'none',
};
