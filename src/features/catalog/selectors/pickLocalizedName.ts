import type { DictionaryRef } from '@/types';
import type { AppLang } from './types';

function nonEmpty(value: string | null | undefined): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

/**
 * Non-null `DictionaryRef` → localized label.
 * Fallbacks: RU → name ‖ nameEn ‖ id; EN → nameEn ‖ name ‖ id.
 * For optional refs callers do `ref ? pickLocalizedName(ref, lang) : null`.
 */
export function pickLocalizedName(ref: DictionaryRef, lang: AppLang): string {
  if (lang === 'en') {
    return nonEmpty(ref.nameEn) ?? nonEmpty(ref.name) ?? ref.id;
  }
  return nonEmpty(ref.name) ?? nonEmpty(ref.nameEn) ?? ref.id;
}

/**
 * Localized description for entries that may have neither variant
 * (`DictionarySettingsEntry`, `AggregateDictionaryItem`).
 * Returns `null` when both variants are empty/null.
 */
export function pickLocalizedDescription(
  entry: { description: string | null; descriptionEn: string | null },
  lang: AppLang,
): string | null {
  if (lang === 'en') {
    return nonEmpty(entry.descriptionEn) ?? nonEmpty(entry.description);
  }
  return nonEmpty(entry.description) ?? nonEmpty(entry.descriptionEn);
}

/**
 * Localized pair of plain RU/EN strings with the same fallback semantics.
 * Used for required name/description fields on BenchmarkTest where both
 * variants are guaranteed non-null by the BE mapper (returns `''` only
 * if BE ever sends two empty strings).
 */
export function pickLocalizedString(
  ru: string,
  en: string,
  lang: AppLang,
): string {
  if (lang === 'en') return nonEmpty(en) ?? nonEmpty(ru) ?? '';
  return nonEmpty(ru) ?? nonEmpty(en) ?? '';
}
