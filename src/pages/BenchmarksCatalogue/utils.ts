import type { BenchmarkType } from "@/types";
import type { CatalogItem } from "./types";

export const getColorByName = (name: string) => {

  const colors = ['--add-red-600'];
  const hash = name.split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);

  const colorIndex = Math.abs(hash) % colors.length;

  return `var(${colors[colorIndex]})`;
}

export function displayDictionaryName(value: { name: string; nameEn?: string } | null | undefined, lang: string) {
  if (!value) return '';
  return lang === 'en' ? value.nameEn || value.name : value.name;
}

export function dictionaryNames(values: Array<{ name: string; nameEn?: string }> | null | undefined, lang: string) {
  return [...new Set((values ?? []).map((value) => displayDictionaryName(value, lang)).filter(Boolean))];
}

export function commonValues<T>(values: T[][]) {
  if (!values.length) return [] as T[];
  return values[0].filter((value) => values.every((list) => list.includes(value)));
}

export function varyingField<T>(values: T[][]) {
  const keys = values.map((value) => [...value].sort().join('|'));
  return new Set(keys).size > 1;
}

export function childDisplayName(suiteName: string, testName: string) {
  const prefix = `${suiteName}:`;
  return testName.startsWith(prefix) ? testName.slice(prefix.length).trim() : testName;
}

export function suiteFacts(tests: CatalogItem[], lang: string) {
  const benchmarks = tests.map((test) => test.benchmark);
  const named = (get: (benchmark: BenchmarkType) => Array<{ name: string; nameEn?: string }>) => benchmarks.map((benchmark) => dictionaryNames(get(benchmark), lang));
  const scalar = (get: (benchmark: BenchmarkType) => { name: string; nameEn?: string } | null | undefined) => {
    const values = benchmarks.map((benchmark) => displayDictionaryName(get(benchmark), lang));
    return values.length && values[0] && values.every((value) => value === values[0]) ? values[0] : '';
  };
  const languages = scalar((benchmark) => benchmark.language);
  const domains = commonValues(named((benchmark) => benchmark.domains)).join(', ');
  const modalityLists = named((benchmark) => benchmark.modalities);
  const commonModality = modalityLists.length && modalityLists.every((value) => value.join('|') === modalityLists[0].join('|')) ? modalityLists[0].join(', ') : '';
  const modality = commonModality || (modalityLists.flat().some((value) => !['text', 'текст'].includes(value.toLocaleLowerCase())) ? 'Мультимодальный' : '');
  const accessValues = benchmarks.map((benchmark) => benchmark.confidentialityLevel || '');
  const access = accessValues.length && accessValues[0] && accessValues.every((value) => value === accessValues[0]) ? accessValues[0] : accessValues.some(Boolean) ? 'Смешанный' : '';
  const sizes = benchmarks.map((benchmark) => Number(benchmark.sizeInSamples) || 0);
  const size = sizes.length && sizes[0] && sizes.every((value) => value === sizes[0]) ? sizes[0].toLocaleString('ru-RU') : '';
  const metrics = benchmarks.map((benchmark) => benchmark.metrics.join(', '));
  const commonMetric = metrics.length && metrics[0] && metrics.every((value) => value === metrics[0]) ? metrics[0] : '';
  const taskType = scalar((benchmark) => benchmark.taskType);
  const difficulty = scalar((benchmark) => benchmark.difficulty);
  return [['Язык', languages], ['Модальность', modality], ['Доступ', access], ['Домен', domains], ['Размер', size], ['Метрика', commonMetric], ['Тип задачи', taskType], ['Сложность', difficulty]].filter(([, value]) => Boolean(value));
}

export function taxonomyTags(test: BenchmarkType, tests: CatalogItem[], lang: string) {
  const benchmarks = tests.map((item) => item.benchmark);
  const distinct = (get: (benchmark: BenchmarkType) => string[]) => {
    const current = get(test);
    const common = new Set(commonValues(benchmarks.map(get)));
    return current.filter((value) => !common.has(value));
  };
  const tags: Array<{ name: string; brand?: boolean }> = [];
  const add = (values: string[], brand = false) => values.forEach((name) => { if (name && !tags.some((tag) => tag.name === name)) tags.push({ name, brand }); });
  add(distinct((benchmark) => dictionaryNames(benchmark.domains, lang)), true);
  add(distinct((benchmark) => dictionaryNames(benchmark.modalities, lang)));
  const taxons = distinct((benchmark) => dictionaryNames(benchmark.abilityTaxons, lang));
  const fallback = distinct((benchmark) => benchmark.abilityTags.length ? benchmark.abilityTags : dictionaryNames(benchmark.subGroups, lang));
  add(taxons.length ? taxons : fallback);
  const visible = tags.slice(0, 3);
  if (tags.length > visible.length) visible.push({ name: `+${tags.length - visible.length}` });
  return visible;
}

export function pluralRu(value: number, forms: [string, string, string]): string {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}