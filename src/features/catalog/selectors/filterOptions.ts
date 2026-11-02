import type { DictionaryRef } from '@/types';
import type {
  BenchmarkTestFilterOptions,
  SubGroupFilterOption,
  SubdomainFilterOption,
} from '@/types';
import { pickLocalizedName } from './pickLocalizedName';
import type {
  AppLang,
  CascadeFilterSelectOption,
  FilterOptionsVM,
  FilterSelectOption,
} from './types';

function toOption(ref: DictionaryRef, lang: AppLang): FilterSelectOption {
  return { value: ref.id, label: pickLocalizedName(ref, lang) };
}

function toSubGroupOption(
  ref: SubGroupFilterOption,
  lang: AppLang,
): CascadeFilterSelectOption {
  return {
    value: ref.id,
    label: pickLocalizedName(ref, lang),
    parentId: ref.macroGroupId,
  };
}

function toSubdomainOption(
  ref: SubdomainFilterOption,
  lang: AppLang,
): CascadeFilterSelectOption {
  return {
    value: ref.id,
    label: pickLocalizedName(ref, lang),
    parentId: ref.domainId,
  };
}

function toFreeForm(values: string[]): FilterSelectOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

export function selectFilterOptionsVM(
  options: BenchmarkTestFilterOptions,
  lang: AppLang,
): FilterOptionsVM {
  return {
    macroGroups: options.macroGroups.map((r) => toOption(r, lang)),
    subGroups: options.subGroups.map((r) => toSubGroupOption(r, lang)),
    abilityTaxons: options.abilityTaxons.map((r) => toOption(r, lang)),
    taskTypes: options.taskTypes.map((r) => toOption(r, lang)),
    modalities: options.modalities.map((r) => toOption(r, lang)),
    languages: options.languages.map((r) => toOption(r, lang)),
    difficulties: options.difficulties.map((r) => toOption(r, lang)),
    capabilities: options.capabilities.map((r) => toOption(r, lang)),
    domains: options.domains.map((r) => toOption(r, lang)),
    subdomains: options.subdomains.map((r) => toSubdomainOption(r, lang)),
    skills: toFreeForm(options.skills),
    abilityTags: toFreeForm(options.abilityTags),
  };
}
