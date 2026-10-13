import { describe, it, expect } from 'vitest';
import { translations } from '@/i18n';
import { formatEnum } from './enum';

describe('formatEnum', () => {
  it('возвращает локализованный лейбл для known taskType', () => {
    expect(formatEnum(translations.ru, 'taskTypes', 'MultipleChoice'))
      .toBe('Множественный выбор');
    expect(formatEnum(translations.en, 'taskTypes', 'MultipleChoice'))
      .toBe('Multiple Choice');
  });

  it('возвращает локализованный лейбл для modality / language / difficulty', () => {
    expect(formatEnum(translations.ru, 'modalities', 'text')).toBe('Текст');
    expect(formatEnum(translations.ru, 'languages', 'ru')).toBe('Русский');
    expect(formatEnum(translations.ru, 'difficulties', 'expert')).toBe('Экспертные знания');
  });

  it('fail-soft: для неизвестного значения возвращает само значение', () => {
    expect(formatEnum(translations.ru, 'taskTypes', 'FutureUnseenEnum'))
      .toBe('FutureUnseenEnum');
  });

  it('пустая строка / null / undefined → ""', () => {
    expect(formatEnum(translations.ru, 'taskTypes', '')).toBe('');
    expect(formatEnum(translations.ru, 'taskTypes', null)).toBe('');
    expect(formatEnum(translations.ru, 'taskTypes', undefined)).toBe('');
  });
});
