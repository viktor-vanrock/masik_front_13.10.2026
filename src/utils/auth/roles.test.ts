import { describe, expect, it } from 'vitest';
import { isAdminRole, isSuperUserRole } from './roles';

describe('isAdminRole', () => {
  it('возвращает true для ADMIN', () => {
    expect(isAdminRole('ADMIN')).toBe(true);
  });

  it('возвращает true для SUPERUSER', () => {
    expect(isAdminRole('SUPERUSER')).toBe(true);
  });

  it('возвращает false для USER', () => {
    expect(isAdminRole('USER')).toBe(false);
  });

  it('возвращает false для null/undefined', () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe('isSuperUserRole', () => {
  it('возвращает true только для SUPERUSER', () => {
    expect(isSuperUserRole('SUPERUSER')).toBe(true);
  });

  it('возвращает false для ADMIN', () => {
    expect(isSuperUserRole('ADMIN')).toBe(false);
  });

  it('возвращает false для USER', () => {
    expect(isSuperUserRole('USER')).toBe(false);
  });

  it('возвращает false для null/undefined', () => {
    expect(isSuperUserRole(null)).toBe(false);
    expect(isSuperUserRole(undefined)).toBe(false);
  });
});
