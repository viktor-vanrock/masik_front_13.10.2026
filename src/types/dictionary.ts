
export const DICTIONARY_CATEGORY = {
  Taxonomy: 'taxonomy',
  Parameters: 'parameters',
  Domains: 'domains',
} as const;

export type DictionaryCategory =
  (typeof DICTIONARY_CATEGORY)[keyof typeof DICTIONARY_CATEGORY];

export const TAXONOMY_TYPE = {
  MacroGroups: 'macro-groups',
  SubGroups: 'sub-groups',
  AbilityTaxons: 'ability-taxons',
} as const;
export type TaxonomyType = (typeof TAXONOMY_TYPE)[keyof typeof TAXONOMY_TYPE];

export const PARAMETERS_TYPE = {
  TaskTypes: 'task-types',
  Modalities: 'modalities',
  Languages: 'languages',
  Difficulties: 'difficulties',
  Capabilities: 'capabilities',
} as const;
export type ParametersType =
  (typeof PARAMETERS_TYPE)[keyof typeof PARAMETERS_TYPE];

export const DOMAINS_TYPE = {
  Domains: 'domains',
  Subdomains: 'subdomains',
} as const;
export type DomainsType = (typeof DOMAINS_TYPE)[keyof typeof DOMAINS_TYPE];

/**
 * Map of category → allowed type literal union.
 *
 * Use this to constrain `(category, type)` pairs at the type level.
 * The runtime constant `DICTIONARY_TYPES_BY_CATEGORY` mirrors it for
 * lookups (filter UI, route generators).
 */
export interface DictionaryTypeByCategory {
  taxonomy: TaxonomyType;
  parameters: ParametersType;
  domains: DomainsType;
}

export type DictionaryType = DictionaryTypeByCategory[DictionaryCategory];

export const DICTIONARY_TYPES_BY_CATEGORY = {
  taxonomy: Object.values(TAXONOMY_TYPE),
  parameters: Object.values(PARAMETERS_TYPE),
  domains: Object.values(DOMAINS_TYPE),
} as const satisfies Record<DictionaryCategory, readonly DictionaryType[]>;

/**
 * Type-level helper for `(category, type)` pairs.
 *
 * `DictionaryPair<'taxonomy'>` → `{ category: 'taxonomy'; type: TaxonomyType }`.
 * Used by Settings CRUD helpers/hooks to enforce valid pairs at compile time.
 */
export type DictionaryPair<C extends DictionaryCategory = DictionaryCategory> = {
  [K in C]: { category: K; type: DictionaryTypeByCategory[K] };
}[C];

/**
 * Types that carry a parent FK (`macroGroupId` / `domainId`) on create.
 * Used for narrowing in form mappers and Settings CRUD handlers.
 */
export type ParentScopedDictionaryType = 'sub-groups' | 'subdomains';

// ─────────────────────────────────────────────────────────────────────────────
// Read shapes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inline reference to a dictionary row on BenchmarkTest
 * read responses. `name` is the Russian display, `nameEn` the English one.
 *
 * Both `name` and `nameEn` are guaranteed non-null by the backend mapper
 * (it falls back `nameEn ← name` when the column is null in the DB).
 */
export interface DictionaryRef {
  id: string;
  name: string;
  nameEn: string;
}

/**
 * Admin list/detail item under `/api/catalog/settings/:category/:type`.
 *
 * `parentId` is present only on `sub-groups` and `subdomains`.
 * `usageCount` drives the "Disable delete" affordance — use it as derived
 * state, do not duplicate it into a separate boolean.
 */
export interface DictionarySettingsEntry {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  parentId: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DictionarySettingsListResponse {
  data: DictionarySettingsEntry[];
  total: number;
}

/**
 * `GET /api/catalog/settings/:category/:type` query.
 * `parentId` is honored only on `sub-groups` / `subdomains`, ignored elsewhere (BE behavior).
 */
export interface DictionarySettingsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write shapes
// ─────────────────────────────────────────────────────────────────────────────

/** Generic create body — used for all root types. */
export interface CreateGenericDictionaryDto {
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
}

/** Create body for `taxonomy/sub-groups`. */
export interface CreateSubGroupDictionaryDto extends CreateGenericDictionaryDto {
  macroGroupId: string;
}

/** Create body for `domains/subdomains`. */
export interface CreateSubdomainDictionaryDto extends CreateGenericDictionaryDto {
  domainId: string;
}

/**
 * Discriminated union of every supported POST body shape.
 * Pick the right variant in feature code via the matching `(category, type)`.
 */
export type CreateDictionaryDto =
  | CreateGenericDictionaryDto
  | CreateSubGroupDictionaryDto
  | CreateSubdomainDictionaryDto;

/**
 * `PATCH` is `PartialType` of the corresponding `Create*Dto` on the BE.
 * On the FE we surface this as Partial of the union — feature code should
 * narrow by `(category, type)` before sending.
 */
export type UpdateDictionaryDto = Partial<CreateGenericDictionaryDto> &
  Partial<Pick<CreateSubGroupDictionaryDto, 'macroGroupId'>> &
  Partial<Pick<CreateSubdomainDictionaryDto, 'domainId'>>;

/**
 * Compile-time mapping `(category, type) → exact create DTO`.
 * Used by mutation hooks to force the correct body shape per pair.
 */
export type CreateDtoFor<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
> = C extends 'taxonomy'
  ? T extends 'sub-groups'
    ? CreateSubGroupDictionaryDto
    : CreateGenericDictionaryDto
  : C extends 'domains'
    ? T extends 'subdomains'
      ? CreateSubdomainDictionaryDto
      : CreateGenericDictionaryDto
    : CreateGenericDictionaryDto;

export type UpdateDtoFor<
  C extends DictionaryCategory,
  T extends DictionaryTypeByCategory[C],
> = Partial<CreateDtoFor<C, T>>;

// ─────────────────────────────────────────────────────────────────────────────
// Public aggregate — GET /api/catalog/settings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strict field subset returned by the public aggregate endpoint.
 * No `usageCount`, no timestamps, no `deletedAt`. Only active rows.
 */
export interface AggregateDictionaryItem {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
}

export type AggregateSubGroupItem = AggregateDictionaryItem & {
  macroGroupId: string;
};

export type AggregateSubdomainItem = AggregateDictionaryItem & {
  domainId: string;
};

export interface SettingsAggregate {
  taxonomy: {
    macroGroups: AggregateDictionaryItem[];
    subGroups: AggregateSubGroupItem[];
    abilityTaxons: AggregateDictionaryItem[];
  };
  parameters: {
    taskTypes: AggregateDictionaryItem[];
    modalities: AggregateDictionaryItem[];
    languages: AggregateDictionaryItem[];
    difficulties: AggregateDictionaryItem[];
    capabilities: AggregateDictionaryItem[];
  };
  domains: {
    domains: AggregateDictionaryItem[];
    subdomains: AggregateSubdomainItem[];
  };
}
