import { describe, it, expect } from 'vitest';
import { formatLocaleDate } from './date';

describe('formatLocaleDate', () => {
  it('возвращает "—" для null / undefined / пустой строки', () => {
    expect(formatLocaleDate('ru', null)).toBe('—');
    expect(formatLocaleDate('ru', undefined)).toBe('—');
    expect(formatLocaleDate('en', '')).toBe('—');
  });

  it('возвращает исходную строку для невалидной даты', () => {
    expect(formatLocaleDate('ru', 'not-a-date')).toBe('not-a-date');
  });

  it('RU использует локаль ru-RU', () => {
    const iso = '2026-04-15T10:00:00Z';
    const out = formatLocaleDate('ru', iso);
    // Формат d.MM.yyyy для ru-RU; точный разделитель/порядок зависит от ICU,
    // поэтому сверяем структурно.
    expect(out).toMatch(/15\.0?4\.2026/);
  });

  it('EN использует локаль en-US', () => {
    const iso = '2026-04-15T10:00:00Z';
    const out = formatLocaleDate('en', iso);
    expect(out).toMatch(/4\/15\/2026/);
  });
});
