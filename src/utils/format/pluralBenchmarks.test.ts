import { describe, it, expect } from 'vitest';
import { translations } from '@/i18n';
import {
  formatBenchmarkPluralWord,
  formatBenchmarkCount,
} from './pluralBenchmarks';

describe('formatBenchmarkPluralWord — RU', () => {
  const t = translations.ru;
  const lang = 'ru' as const;

  it('1 → "бенчмарк"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 1)).toBe('бенчмарк');
  });
  it('2 → "бенчмарка"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 2)).toBe('бенчмарка');
  });
  it('5 → "бенчмарков"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 5)).toBe('бенчмарков');
  });
  it('11 → "бенчмарков" (исключение для 11..14)', () => {
    expect(formatBenchmarkPluralWord(t, lang, 11)).toBe('бенчмарков');
  });
  it('21 → "бенчмарк" (заканчивается на 1, но не 11)', () => {
    expect(formatBenchmarkPluralWord(t, lang, 21)).toBe('бенчмарк');
  });
  it('0 → "бенчмарков"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 0)).toBe('бенчмарков');
  });
});

describe('formatBenchmarkPluralWord — EN', () => {
  const t = translations.en;
  const lang = 'en' as const;

  it('1 → "benchmark"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 1)).toBe('benchmark');
  });
  it('0 → "benchmarks"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 0)).toBe('benchmarks');
  });
  it('42 → "benchmarks"', () => {
    expect(formatBenchmarkPluralWord(t, lang, 42)).toBe('benchmarks');
  });
});

describe('formatBenchmarkCount — собирает число + слово', () => {
  it('RU 1234 → "1 234 бенчмарка"', () => {
    // toLocaleString('ru-RU') использует U+00A0 (NBSP) как разделитель тысяч.
    const out = formatBenchmarkCount(translations.ru, 'ru', 1234);
    expect(out).toMatch(/^1.234 бенчмарка$/);
  });
  it('EN 1234 → "1,234 benchmarks"', () => {
    expect(formatBenchmarkCount(translations.en, 'en', 1234)).toBe('1,234 benchmarks');
  });
  it('EN 1 → "1 benchmark" (singular)', () => {
    expect(formatBenchmarkCount(translations.en, 'en', 1)).toBe('1 benchmark');
  });
});
