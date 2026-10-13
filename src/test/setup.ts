/**
 * Глобальный setup для Vitest. Выполняется перед каждым test-файлом.
 *
 * Что подключаем:
 *   - jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, ...)
 *   - чистка localStorage между тестами, чтобы AuthStorage не "протекал"
 *   - mock matchMedia (jsdom его не реализует, ломает компоненты Radix/Tailwind)
 */

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}

// Some Node desktop runtimes expose an incomplete global Web Storage object
// when `--localstorage-file` has no path. JSDOM tests need the browser contract.
if (typeof globalThis.localStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}
if (typeof globalThis.sessionStorage?.clear !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom не реализует matchMedia. Многие UI-компоненты (Radix, Tailwind) её зовут.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
