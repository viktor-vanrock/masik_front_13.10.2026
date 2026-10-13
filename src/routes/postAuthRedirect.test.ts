import { describe, expect, it } from 'vitest';
import { mockUser } from '@/test/mocks/user';
import { postAuthRedirect } from './postAuthRedirect';

describe('postAuthRedirect', () => {
  it.each(['https://example.test', '//example.test', 'javascript:alert(1)', '/login', '/register'])('does not redirect to %s', (pathname) => {
    expect(postAuthRedirect({ from: { pathname } }, mockUser())).toBe('/');
  });
  it('checks the returned user role and permits the authenticated submission route', () => {
    expect(postAuthRedirect({ from: { pathname: '/admin' } }, mockUser({ role: 'USER' }))).toBe('/');
    expect(postAuthRedirect({ from: { pathname: '/add-benchmark' } }, mockUser({ role: 'USER' }))).toBe('/add-benchmark');
    expect(postAuthRedirect(null, mockUser())).toBe('/');
  });
});
