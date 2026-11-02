/**
 * Локалезависимый счётчик бенчмарков.
 *
 * Заменяет хардкод `Pluralord(n, ['бенчмарк','бенчмарка','бенчмарков'])`,
 * который раньше использовался и в EN-режиме (выдавал "42 бенчмарков").
 *
 * Контракт:
 *   - словарь `t.common.benchmarkPlural` — массив [one, few, many] (см. i18n).
 *   - RU использует все 3 формы по правилам русского языка.
 *   - EN использует [singular, plural, plural] и резолвится через `n === 1`.
 *
 * Возвращает только склонённое СЛОВО, без числа. Сборку строки вида
 * "{n} {word}" оставляем call-site'у — на нём может быть локализованное
 * форматирование числа (`n.toLocaleString(lang)`).
 *
 * @example
 *   `${total} ${formatBenchmarkPluralWord(t, lang, total)}`
 */
import type { AnyTranslations, Lang } from '@/i18n';
import { Pluralord } from '@/utils.ts/pluralRu';

export function formatBenchmarkPluralWord(
  t: AnyTranslations,
  lang: Lang,
  n: number,
): string {
  const forms = t.common.benchmarkPlural as readonly [string, string, string];

  if (lang === 'ru') {
    return Pluralord(n, [forms[0], forms[1], forms[2]]);
  }

  // EN: singular для 1, иначе plural. Тройка форм в EN — [singular, plural, plural],
  // т.е. forms[1] === forms[2], так что выбор между ними не важен.
  return Math.abs(n) === 1 ? forms[0] : forms[1];
}

/**
 * Удобный композит: возвращает уже готовую строку "{n} {word}" с
 * локалезависимым форматированием числа.
 */
export function formatBenchmarkCount(
  t: AnyTranslations,
  lang: Lang,
  n: number,
): string {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  return `${n.toLocaleString(locale)} ${formatBenchmarkPluralWord(t, lang, n)}`;
}
