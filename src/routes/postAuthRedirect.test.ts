import { describe, expect, it } from 'vitest';
import { mockUser } from '@/test/mocks/user';
import { postAuthRedirect } from './postAuthRedirect';

describe('postAuthRedirect', () => {
  it.each([
    'https://example.test', '//example.test', 'javascript:alert(1)', 'create', '',
    '/login', '/register', '/LOGIN/', '/%72egister', '/create?mode=create', '/create#chat',
    '/\\example.test', '/%5cexample.test', '/%2fexample.test', '/safe/../admin', '/safe/%2e%2e/admin',
    '/create\n', '/create%00', '/create%20', '/create%ZZ',
  ])('does not redirect to %s', (pathname) => {
    expect(postAuthRedirect({ from: { pathname } }, mockUser())).toBe('/');
  });
  it('checks the returned user role and permits the authenticated submission route', () => {
    expect(postAuthRedirect({ from: { pathname: '/admin' } }, mockUser({ role: 'USER' }))).toBe('/');
    expect(postAuthRedirect({ from: { pathname: '/add-benchmark' } }, mockUser({ role: 'USER' }))).toBe('/add-benchmark');
    expect(postAuthRedirect(null, mockUser())).toBe('/');
  });

  it('keeps the complete create intent, encoding, repeated query values, and fragment', () => {
    const from = {
      pathname: '/create',
      search: '?mode=modify&base=suite%2Fid&baseType=suite&new=entry-uuid&tag=a&tag=b',
      hash: '#conversation',
    };
    expect(postAuthRedirect({ from }, mockUser())).toBe(from.pathname + from.search + from.hash);
    expect(postAuthRedirect({ from: { pathname: '/catalog', search: '?q=код&next=https://example.test' } }, null))
      .toBe('/catalog?q=код&next=https://example.test');
  });

  it.each([
    undefined, null, false, 7, '/create', [], {},
    { from: null }, { from: true }, { from: '/create' }, { from: [] },
    { from: { pathname: 1 } }, { from: { pathname: '/create', search: null } },
    { from: { pathname: '/create', search: ['?mode=create'] } },
    { from: { pathname: '/create', search: 'https://example.test' } },
    { from: { pathname: '/create', search: '?mode=create#fragment' } },
    { from: { pathname: '/create', hash: 1 } }, { from: { pathname: '/create', hash: {} } },
    { from: { pathname: '/create', hash: '?mode=create' } },
    { from: { pathname: '/create', search: '?mode=cre\nate' } },
    { from: { pathname: '/create', hash: '#cha\rt' } },
  ])('falls back safely for malformed location state %#', state => {
    expect(postAuthRedirect(state, mockUser())).toBe('/');
  });

  it.each(['/admin', '/admin/edit/42', '/ADMIN/', '/%61dmin/edit/42'])('checks roles before adding query and hash for %s', pathname => {
    const from = { pathname, search: '?tab=users', hash: '#settings' };
    expect(postAuthRedirect({ from }, mockUser({ role: 'USER' }))).toBe('/');
    expect(postAuthRedirect({ from }, null)).toBe('/');
    expect(postAuthRedirect({ from }, mockUser({ role: 'ADMIN' }))).toBe(`${pathname}?tab=users#settings`);
    expect(postAuthRedirect({ from }, mockUser({ role: 'SUPERUSER' }))).toBe(`${pathname}?tab=users#settings`);
  });

  it('does not allow a guest into a protected return path with query parameters', () => {
    expect(postAuthRedirect({ from: { pathname: '/create', search: '?mode=create&new=uuid', hash: '#chat' } }, null)).toBe('/');
  });
});
