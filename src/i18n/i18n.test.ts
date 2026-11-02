import { describe, it, expect } from 'vitest';
import { translations } from './index';

/**
 * Тест полноты словарей.
 *
 * Цель — гарантировать, что переводы добавляются симметрично во всех
 * локалях. Особенно важно для блока `auth.errors`, который используется
 * Zod-фабрикой `buildAuthSchemas`: пропущенный ключ в одной локали даст
 * `undefined` в `message`, и пользователь увидит пустую строку под полем.
 *
 * Стратегия:
 *   Берём `ru` как референс (исторически основной язык продукта) и
 *   рекурсивно сверяем форму с `en`. Сообщение об ошибке указывает на
 *   конкретный отсутствующий путь, чтобы быстро найти проблему.
 */

type Dict = Record<string, unknown>;

const isPlainObject = (v: unknown): v is Dict =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Собирает плоский список путей до листьев словаря: ['auth.errors.passwordMin', ...]. */
const collectPaths = (value: unknown, prefix = ''): string[] => {
  if (!isPlainObject(value)) return [prefix];
  return Object.keys(value)
    .sort()
    .flatMap((k) =>
      collectPaths((value as Dict)[k], prefix ? `${prefix}.${k}` : k),
    );
};

describe('i18n translations — полнота словарей', () => {
  it('ru и en имеют одинаковый набор путей до листьев', () => {
    const ruPaths = collectPaths(translations.ru);
    const enPaths = collectPaths(translations.en);

    const onlyInRu = ruPaths.filter((p) => !enPaths.includes(p));
    const onlyInEn = enPaths.filter((p) => !ruPaths.includes(p));

    expect(onlyInRu, `Missing in en: ${onlyInRu.join(', ')}`).toEqual([]);
    expect(onlyInEn, `Missing in ru: ${onlyInEn.join(', ')}`).toEqual([]);
  });

  it('auth.errors симметричен между ru и en (критично для Zod-фабрики)', () => {
    const ruKeys = Object.keys(translations.ru.auth.errors).sort();
    const enKeys = Object.keys(translations.en.auth.errors).sort();
    expect(ruKeys).toEqual(enKeys);
  });

  it('ни одно сообщение auth.errors не пустое', () => {
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      for (const [key, value] of Object.entries(dict.auth.errors)) {
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `Empty auth.errors.${key} in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('benchmark.errors симметричен между ru и en (критично для Zod-фабрики)', () => {
    const ruKeys = Object.keys(translations.ru.benchmark.errors).sort();
    const enKeys = Object.keys(translations.en.benchmark.errors).sort();
    expect(ruKeys).toEqual(enKeys);
  });

  it('ни одно сообщение benchmark.errors не пустое', () => {
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      for (const [key, value] of Object.entries(dict.benchmark.errors)) {
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `Empty benchmark.errors.${key} in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });


  it('common.errors заполнен в обеих локалях', () => {
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      for (const [key, value] of Object.entries(dict.common.errors)) {
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `Empty common.errors.${key} in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('common.aria заполнен в обеих локалях (используется в aria-label/title)', () => {
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      for (const [key, value] of Object.entries(dict.common.aria)) {
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `Empty common.aria.${key} in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('capabilities содержит все 5 ключей и в каждой локали непустые', () => {
    const expected = ['fewShot', 'rag', 'tools', 'reasoning', 'longContext'].sort();
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      const actual = Object.keys(dict.capabilities).sort();
      expect(actual, `capabilities keys mismatch in "${lang}"`).toEqual(expected);
      for (const [key, value] of Object.entries(dict.capabilities)) {
        expect(
          typeof value === 'string' && value.trim().length > 0,
          `Empty capabilities.${key} in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('common.benchmarkPlural — массив ровно из 3 элементов в обеих локалях', () => {
    // RU pluralization rules требуют [one, few, many]. EN сохраняет ту же
    // форму ради симметрии (resolver игнорирует слот many для EN).
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      const arr = dict.common.benchmarkPlural;
      expect(Array.isArray(arr), `benchmarkPlural is not array in "${lang}"`).toBe(true);
      expect(arr.length, `benchmarkPlural must have 3 forms in "${lang}"`).toBe(3);
      for (const form of arr) {
        expect(
          typeof form === 'string' && form.trim().length > 0,
          `Empty benchmarkPlural form in locale "${lang}"`,
        ).toBe(true);
      }
    }
  });

  it('create.recommendYes/NoKeywords — непустые массивы строк в обеих локалях', () => {
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      for (const key of ['recommendYesKeywords', 'recommendNoKeywords'] as const) {
        const arr = dict.create[key];
        expect(Array.isArray(arr), `${key} is not array in "${lang}"`).toBe(true);
        expect(arr.length, `${key} is empty in "${lang}"`).toBeGreaterThan(0);
        for (const kw of arr) {
          expect(
            typeof kw === 'string' && kw.trim().length > 0,
            `Empty keyword in create.${key} (${lang})`,
          ).toBe(true);
        }
      }
    }
  });

  it('newBenchmark.steps содержит 5 шагов в каждой локали', () => {
    const expected = ['basic', 'taxonomy', 'parameters', 'domains', 'examples'].sort();
    for (const [lang, dict] of Object.entries(translations) as [
      'ru' | 'en',
      (typeof translations)['ru'],
    ][]) {
      const actual = Object.keys(dict.newBenchmark.steps).sort();
      expect(actual, `newBenchmark.steps keys mismatch in "${lang}"`).toEqual(expected);
    }
  });
});
