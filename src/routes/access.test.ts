import { describe, it, expect } from 'vitest';
import { canAccess, getRequiredAccess } from './access';
import { mockUser } from '@/test/mocks/user';

describe('getRequiredAccess', () => {
  it('public для /login', () => {
    expect(getRequiredAccess('/login')).toBe('public');
  });
  it('authenticated для /profile', () => {
    expect(getRequiredAccess('/profile')).toBe('authenticated');
  });
  it('admin для /admin', () => {
    expect(getRequiredAccess('/admin')).toBe('admin');
  });
  it('admin для вложенных /admin/edit/42 через префикс', () => {
    expect(getRequiredAccess('/admin/edit/42')).toBe('admin');
  });
  it('authenticated для /add-benchmark', () => {
    expect(getRequiredAccess('/add-benchmark')).toBe('authenticated');
  });
  it('authenticated для /create', () => {
    expect(getRequiredAccess('/create')).toBe('authenticated');
  });
  it('public для неизвестного pathname (по умолчанию)', () => {
    expect(getRequiredAccess('/unknown/path')).toBe('public');
  });
  it('public для главной "/"', () => {
    expect(getRequiredAccess('/')).toBe('public');
  });
});

describe('canAccess', () => {
  const guest = null;
  const userRegular = mockUser({ role: 'USER' });
  const userAdmin = mockUser({ role: 'ADMIN' });
  const userSuper = mockUser({ role: 'SUPERUSER' });

  it('гость идёт на public', () => {
    expect(canAccess('/login', guest)).toBe(true);
    expect(canAccess('/', guest)).toBe(true);
  });

  it('гость не идёт на authenticated', () => {
    expect(canAccess('/profile', guest)).toBe(false);
  });

  it('USER проходит на authenticated, но не на admin', () => {
    expect(canAccess('/profile', userRegular)).toBe(true);
    expect(canAccess('/admin', userRegular)).toBe(false);
    expect(canAccess('/admin/edit/1', userRegular)).toBe(false);
  });

  it('ADMIN проходит везде, кроме super-only (которых пока нет)', () => {
    expect(canAccess('/profile', userAdmin)).toBe(true);
    expect(canAccess('/admin', userAdmin)).toBe(true);
    expect(canAccess('/admin/edit/1', userAdmin)).toBe(true);
  });

  it('SUPERUSER проходит на admin', () => {
    expect(canAccess('/admin', userSuper)).toBe(true);
  });

  it('/add-benchmark: USER/ADMIN/SUPERUSER могут отправлять заявки, гость отбивается', () => {
    expect(canAccess('/add-benchmark', guest)).toBe(false);
    expect(canAccess('/add-benchmark', userRegular)).toBe(true);
    expect(canAccess('/add-benchmark', userAdmin)).toBe(true);
    expect(canAccess('/add-benchmark', userSuper)).toBe(true);
  });

  it('/create: любой залогиненный, гость отбивается', () => {
    expect(canAccess('/create', guest)).toBe(false);
    expect(canAccess('/create', userRegular)).toBe(true);
    expect(canAccess('/create', userAdmin)).toBe(true);
  });
});
