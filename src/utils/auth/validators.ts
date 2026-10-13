/**
 * Схема НЕ знает о текущем языке и не хранит ключей. Тексты сообщений
 * приходят снаружи через `buildAuthSchemas(messages)`. Это даёт:
 */

import { z } from "zod";

/**
 * Соответствует `Translations["auth"]["errors"]`, но объявлен здесь явно,
 * чтобы validators.ts не зависел от структуры словарей i18n напрямую —
 *
 * При добавлении нового правила:
 *   1) добавить поле сюда;
 *   2) добавить ключ в `ru.auth.errors` и `en.auth.errors` (тест полноты
 *      словарей поймает рассинхрон);
 *   3) использовать в фабрике ниже.
 */
export interface AuthValidationMessages {
  usernameRequired: string;
  usernameTooLong: string;
  passwordMin: string;
  passwordMax: string;
  passwordLower: string;
  // passwordUpper: string;
  passwordDigit: string;
  passwordSymbol: string;
  emailInvalid: string;
  emailTooLong: string;
  passwordsMismatch: string;
}

/**
 * Фабрика auth-схем.
 *
 * Принимает уже локализованный словарь сообщений и возвращает набор
 * готовых Zod-схем. Pure: одна локаль → один набор схем; никаких побочных
 * эффектов, никаких глобальных мутаций (`z.config`/`setErrorMap` не трогаем).
 *
 * Возвращаемая форма:
 *   - `login`     — схема формы логина;
 *   - `register`  — схема формы регистрации (с проверкой совпадения паролей);
 *   - `username`, `password`, `email` — атомарные схемы, экспортируем для
 */
export const buildAuthSchemas = (messages: AuthValidationMessages) => {
  const username = z
    .string()
    .min(1, { error: messages.usernameRequired })
    .max(64, { error: messages.usernameTooLong });

  const password = z
    .string()
    .min(8, { error: messages.passwordMin })
    .max(72, { error: messages.passwordMax })
    .regex(/[a-z]/, { error: messages.passwordLower })
    // .regex(/[A-Z]/, { error: messages.passwordUpper })
    .regex(/\d/, { error: messages.passwordDigit })
    .regex(/[^a-zA-Z0-9]/, { error: messages.passwordSymbol });

  const email = z
    .email({ error: messages.emailInvalid })
    .max(254, { error: messages.emailTooLong });

  const login = z.object({
    username,
    password,
  });

  const register = z
    .object({
      username,
      password,
      confirmPassword: z.string(),
      email,
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: messages.passwordsMismatch,
      path: ["confirmPassword"],
    });

  return { username, password, email, login, register };
};

export type AuthSchemas = ReturnType<typeof buildAuthSchemas>;
export type LoginFormValues = z.infer<AuthSchemas["login"]>;
export type RegisterFormValues = z.infer<AuthSchemas["register"]>;
