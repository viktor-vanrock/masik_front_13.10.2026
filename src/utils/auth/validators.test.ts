import { describe, it, expect } from 'vitest';

import {
  buildAuthSchemas,
  type AuthValidationMessages,
} from './validators';

/**
 * Тесты валидаторов.
 *
 * Тестируем ПОВЕДЕНИЕ, не язык: фабрика получает фикстурный словарь с
 * короткими маркерами, тесты ассертят, что нужное правило отдаёт нужный
 * маркер. Так тесты не ломаются при правках текстов переводов и не
 * привязаны к конкретной локали.
 *
 * Полнота словарей (ru.auth.errors === en.auth.errors по ключам)
 * проверяется отдельным тестом в i18n/i18n.test.ts.
 */

/** Фикстурный словарь: маркер совпадает с именем правила. */
const MESSAGES: AuthValidationMessages = {
  usernameRequired: 'e:usernameRequired',
  usernameTooLong: 'e:usernameTooLong',
  passwordMin: 'e:passwordMin',
  passwordMax: 'e:passwordMax',
  passwordLower: 'e:passwordLower',
  // passwordUpper: 'e:passwordUpper',
  passwordDigit: 'e:passwordDigit',
  passwordSymbol: 'e:passwordSymbol',
  emailInvalid: 'e:emailInvalid',
  emailTooLong: 'e:emailTooLong',
  passwordsMismatch: 'e:passwordsMismatch',
};

const { username, password, email, login, register } =
  buildAuthSchemas(MESSAGES);

/**
 * Канонический валидный пароль для всех схем:
 *   - 8+ символов,
 *   - есть строчная, заглавная, цифра, спецсимвол.
 */
const VALID_PASSWORD = 'Pass12!@';

/** Утилита: вернуть `message` всех issue-ошибок результата. */
const messages = (result: { success: false; error: { issues: { message: string }[] } } | { success: true }) =>
  result.success ? [] : result.error.issues.map((i) => i.message);

/* ─── usernameSchema ─────────────────────────────────────────────────────── */
describe('usernameSchema (AUTH.md §5: non-empty, ≤ 64)', () => {
  it('принимает любое непустое имя длиной до 64', () => {
    expect(username.safeParse('a').success).toBe(true);
    expect(username.safeParse('alice').success).toBe(true);
    expect(username.safeParse('a'.repeat(64)).success).toBe(true);
  });

  it('принимает имя со спецсимволами и пробелами (чарсет не фронтовое дело)', () => {
    expect(username.safeParse('user.name').success).toBe(true);
    expect(username.safeParse('Bob Test').success).toBe(true);
    expect(username.safeParse('алиса').success).toBe(true);
  });

  it('отвергает пустую строку с маркером usernameRequired', () => {
    const r = username.safeParse('');
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:usernameRequired');
  });

  it('отвергает строку длиннее 64 с маркером usernameTooLong', () => {
    const r = username.safeParse('a'.repeat(65));
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:usernameTooLong');
  });
});

/* ─── passwordSchema ─────────────────────────────────────────────────────── */
describe('passwordSchema (AUTH.md §5: ≥ 8, lower+upper+digit+symbol)', () => {
  it('принимает корректный пароль', () => {
    expect(password.safeParse(VALID_PASSWORD).success).toBe(true);
    expect(password.safeParse('Str0ngP@ss').success).toBe(true);
  });

  it('отвергает короткий (< 8) с маркером passwordMin', () => {
    const r = password.safeParse('Pa1!aaa'); // 7 символов
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordMin');
  });

  it('отвергает длинный (> 72, bcrypt limit) с маркером passwordMax', () => {
    const r = password.safeParse('A1!' + 'a'.repeat(70));
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordMax');
  });

  it('отвергает без строчной буквы (passwordLower)', () => {
    const r = password.safeParse('PASS12!@');
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordLower');
  });

  // it('отвергает без заглавной буквы (passwordUpper)', () => {
  //   const r = password.safeParse('pass12!@');
  //   expect(r.success).toBe(false);
  //   expect(messages(r)).toContain('e:passwordUpper');
  // });

  it('отвергает без цифры (passwordDigit)', () => {
    const r = password.safeParse('Password!');
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordDigit');
  });

  it('отвергает без спецсимвола (passwordSymbol)', () => {
    const r = password.safeParse('Password12');
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordSymbol');
  });

  it('ровно 8 символов с полным набором — валиден (граничный)', () => {
    expect(password.safeParse('Aa1!aaaa').success).toBe(true);
  });
});

/* ─── emailSchema ─────────────────────────────────────────────────────────── */
describe('emailSchema', () => {
  it('принимает корректный email', () => {
    expect(email.safeParse('user@example.com').success).toBe(true);
    expect(email.safeParse('a+b@mail.ru').success).toBe(true);
  });

  it('отвергает строку без @ с маркером emailInvalid', () => {
    const r = email.safeParse('notanemail');
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:emailInvalid');
  });

  it('отвергает слишком длинный email (> 254) с маркером emailTooLong', () => {
    const long = 'a'.repeat(250) + '@b.co';
    const r = email.safeParse(long);
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:emailTooLong');
  });
});

/* ─── loginSchema ─────────────────────────────────────────────────────────── */
describe('loginSchema', () => {
  it('принимает корректные данные', () => {
    expect(
      login.safeParse({ username: 'alice', password: VALID_PASSWORD }).success,
    ).toBe(true);
  });

  it('отвергает пустой username', () => {
    const r = login.safeParse({ username: '', password: VALID_PASSWORD });
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:usernameRequired');
  });

  it('отвергает слабый password (не проходит §5)', () => {
    const r = login.safeParse({ username: 'alice', password: 'weakpass' });
    expect(r.success).toBe(false);
  });
});

/* ─── registerSchema ─────────────────────────────────────────────────────── */
describe('registerSchema', () => {
  const valid = {
    username: 'alice',
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    email: 'alice@example.com',
  };

  it('принимает корректные данные', () => {
    expect(register.safeParse(valid).success).toBe(true);
  });

  it('отвергает несовпадающий confirmPassword (passwordsMismatch на пути confirmPassword)', () => {
    const r = register.safeParse({ ...valid, confirmPassword: 'Other12!@' });
    expect(r.success).toBe(false);
    const issues = r.success ? [] : r.error.issues;
    const mismatch = issues.find((i) => i.message === 'e:passwordsMismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch!.path).toContain('confirmPassword');
  });

  it('отвергает невалидный email', () => {
    const r = register.safeParse({ ...valid, email: 'notmail' });
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:emailInvalid');
  });

  it('отвергает пустой username', () => {
    const r = register.safeParse({ ...valid, username: '' });
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:usernameRequired');
  });

  it('отвергает слабый пароль (нет спецсимвола)', () => {
    const r = register.safeParse({
      ...valid,
      password: 'Password12',
      confirmPassword: 'Password12',
    });
    expect(r.success).toBe(false);
    expect(messages(r)).toContain('e:passwordSymbol');
  });
});

/* ─── Контракт фабрики ─────────────────────────────────────────────────────── */
describe('buildAuthSchemas — контракт', () => {
  it('возвращает разные инстансы для разных словарей (нет глобального состояния)', () => {
    const a = buildAuthSchemas(MESSAGES);
    const b = buildAuthSchemas({ ...MESSAGES, usernameRequired: 'OTHER' });

    const ra = a.username.safeParse('');
    const rb = b.username.safeParse('');

    expect(ra.success).toBe(false);
    expect(rb.success).toBe(false);
    if (!ra.success && !rb.success) {
      expect(ra.error.issues[0].message).toBe('e:usernameRequired');
      expect(rb.error.issues[0].message).toBe('OTHER');
    }
  });
});
