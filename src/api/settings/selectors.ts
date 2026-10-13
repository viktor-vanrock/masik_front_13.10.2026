import type { DictionarySettingsEntry } from '@/types';

/** Admin entries are deletable only when nothing references them. */
export function canDeleteDictionaryEntry(entry: DictionarySettingsEntry): boolean {
  return entry.usageCount === 0;
}
