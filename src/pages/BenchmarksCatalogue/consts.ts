import type { CatalogFilterKey } from "./types";

export const FILTER_LABELS: Record<CatalogFilterKey, string> = {
  suites: 'Набор', language: 'Язык', modality: 'Модальность', taskType: 'Тип задачи',
  difficulty: 'Сложность', capability: 'Возможности', domain: 'Домен', subdomain: 'Поддомен',
  macroGroup: 'Группа способности', subGroup: 'Подгруппа способности',
  abilityTaxon: 'Конкретная способность', abilityTag: 'Детальный тег',
};