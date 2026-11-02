/**
 * Локалезависимое форматирование ISO-даты для отображения в UI.
 *
 * Заменяет повторяющуюся конструкцию
 *   `new Date(iso).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US')`
 * из DialogueItem, DialogueListItem, ValidationCard, ModalHeader, CategoryRow.
 *
 * Поведение:
 *   - `undefined` / пустая строка → '—' (визуальный плейсхолдер).
 *   - Невалидная дата → возвращаем исходную строку (для отладки удобнее, чем
 *     "Invalid Date" из toLocaleDateString).
 *   - Валидная дата → `toLocaleDateString` с локалью, соответствующей `lang`.
 *
 * Опции форматирования по умолчанию совпадают с поведением, которое было
 * до рефакторинга (без явных options). Если понадобится короткий формат —
 * расширим вторым параметром.
 */
import type { Lang } from '@/i18n';

const LOCALE_BY_LANG: Record<Lang, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export function formatLocaleDate(
  lang: Lang,
  iso: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(LOCALE_BY_LANG[lang], options);
}
