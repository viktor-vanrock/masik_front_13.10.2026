/**
 * Лейблы серверных enum'ов из i18n.
 *
 * Контекст: `BenchmarkType.taskType` / `modality` / `language` / `difficulty` —
 * это enum-значения от бэка (`'MultipleChoice'`, `'text'`, ...). Они
 * НЕ предназначены для прямого показа пользователю. До рефакторинга на
 * страницах встречалось `<span>{benchmark.taskType}</span>` — пользователь
 * видел сырое 'MultipleChoice' вместо локализованной "Множественный выбор".
 *
 * Эта утилита:
 *   - типизирована: `kind` гарантирует существование подсекции в словаре;
 *   - fail-soft: если ключа нет в словаре (например, бэк прислал новый enum,
 *     которого мы ещё не знаем) — возвращает исходное значение, а не
 *     undefined и не падает.
 *
 * Использование:
 *   formatEnum(t, 'taskTypes', benchmark.taskType)
 *   formatEnum(t, 'modalities', benchmark.modality)
 *
 * Альтернатива — `useEnumLabels()` (см. ниже), если на странице много
 * вызовов и хочется не таскать `t` через все props.
 */
import type { AnyTranslations } from '@/i18n';

export type EnumKind = 'taskTypes' | 'modalities' | 'languages' | 'difficulties';

export function formatEnum(
  t: AnyTranslations,
  kind: EnumKind,
  value: string | null | undefined,
): string {
  if (!value) return '';
  const dict = t[kind] as Record<string, string>;
  return dict[value] ?? value;
}
