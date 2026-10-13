import type { User, UserRole } from '@/types';

/**
 * Фабрика тестового User-объекта.
 *
 * @example
 * mockUser();                          // дефолтный USER
 * mockUser({ role: 'SUPERUSER' });     // SuperUser с дефолтным username
 * mockUser({ username: 'alice' });     // переопределяем поле
 */
export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    username: 'testuser',
    role: 'USER' as UserRole,
    ...overrides,
  };
}
