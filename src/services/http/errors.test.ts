import { describe, it, expect } from 'vitest';
import {
  ApiException,
  ForbiddenError,
  NetworkError,
  isApiError,
  normalizeApiError,
  formatServerErrorMessage,
} from './errors';

describe('isApiError', () => {
  it('распознаёт корректный ApiError со строкой', () => {
    expect(isApiError({ statusCode: 401, message: 'Unauthorized' })).toBe(true);
  });

  it('распознаёт ApiError с массивом message (validation)', () => {
    expect(
      isApiError({ statusCode: 400, message: ['email must be email'] })
    ).toBe(true);
  });

  it('возвращает false для null/undefined/строки', () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError('error')).toBe(false);
  });

  it('возвращает false, если нет statusCode', () => {
    expect(isApiError({ message: 'oops' })).toBe(false);
  });

  it('возвращает false, если message не строка и не массив', () => {
    expect(isApiError({ statusCode: 500, message: 123 })).toBe(false);
  });
});

describe('normalizeApiError', () => {
  it('возвращает payload как есть, если уже валидный ApiError', () => {
    const payload = { statusCode: 403, message: 'Forbidden' };
    expect(normalizeApiError(403, payload, 'fallback')).toBe(payload);
  });

  it('подхватывает message без statusCode', () => {
    const result = normalizeApiError(409, { message: 'Conflict' }, 'fallback');
    expect(result).toEqual({ statusCode: 409, message: 'Conflict' });
  });

  it('подхватывает массив validation-ошибок', () => {
    const result = normalizeApiError(
      400,
      { message: ['username is required'] },
      'fallback'
    );
    expect(result).toEqual({
      statusCode: 400,
      message: ['username is required'],
    });
  });

  it('возвращает fallback при пустом теле', () => {
    expect(normalizeApiError(500, null, 'Server error')).toEqual({
      statusCode: 500,
      message: 'Server error',
    });
  });

  it('возвращает fallback при HTML-строке (бэк лежит)', () => {
    expect(normalizeApiError(502, '<html>...</html>', 'Bad gateway')).toEqual({
      statusCode: 502,
      message: 'Bad gateway',
    });
  });
});

describe('ApiException', () => {
  it('копирует statusCode и payload, берёт первую строку для message', () => {
    const payload = { statusCode: 400, message: ['a', 'b'] };
    const e = new ApiException(payload);
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(400);
    expect(e.payload).toBe(payload);
    expect(e.message).toBe('a');
    expect(e.name).toBe('ApiException');
  });

  it('берёт строковый message как есть', () => {
    const e = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    expect(e.message).toBe('Unauthorized');
  });
});

describe('ForbiddenError', () => {
  it('наследуется от ApiException и помечается своим name', () => {
    const e = new ForbiddenError({ statusCode: 403, message: 'Forbidden' });
    expect(e).toBeInstanceOf(ApiException);
    expect(e).toBeInstanceOf(ForbiddenError);
    expect(e.name).toBe('ForbiddenError');
    expect(e.status).toBe(403);
  });
});

describe('NetworkError', () => {
  it('базовый Error с дефолтным сообщением', () => {
    const e = new NetworkError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('NetworkError');
    expect(e.message).toBe('Network error');
  });

  it('принимает кастомное сообщение', () => {
    expect(new NetworkError('timeout').message).toBe('timeout');
  });
});

describe('formatServerErrorMessage', () => {
  it('null/undefined → null', () => {
    expect(formatServerErrorMessage(null)).toBeNull();
    expect(formatServerErrorMessage(undefined)).toBeNull();
  });

  it('ApiException со строковым message → строка', () => {
    const e = new ApiException({ statusCode: 401, message: 'Unauthorized' });
    expect(formatServerErrorMessage(e)).toBe('Unauthorized');
  });

  it('ApiException с массивом message → склейка через ", "', () => {
    const e = new ApiException({
      statusCode: 400,
      message: ['username is required', 'password is weak'],
    });
    expect(formatServerErrorMessage(e)).toBe(
      'username is required, password is weak'
    );
  });

  it('ForbiddenError (наследник ApiException) → корректно обрабатывается', () => {
    const e = new ForbiddenError({ statusCode: 403, message: 'Forbidden' });
    expect(formatServerErrorMessage(e)).toBe('Forbidden');
  });

  it('NetworkError → .message', () => {
    expect(formatServerErrorMessage(new NetworkError('offline'))).toBe('offline');
  });

  it('обычный Error → .message', () => {
    expect(formatServerErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('примитив (string/number) → null', () => {
    expect(formatServerErrorMessage('oops')).toBeNull();
    expect(formatServerErrorMessage(42)).toBeNull();
  });
});
