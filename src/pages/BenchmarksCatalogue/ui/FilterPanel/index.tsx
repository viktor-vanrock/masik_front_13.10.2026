import { useMemo } from 'react';
import { ActiveChips } from '@/components/ui/ActiveChips';
import { useApp } from '@/hooks/useApp';
import { X as IconX, SlidersHorizontal } from 'lucide-react';
import { formatBenchmarkCount } from '@/utils/format/pluralBenchmarks';
import { useFilterOptionsQuery } from '@/api/catalog';
import {
  selectFilterOptionsVM,
  type FilterOptionsVM,
} from '@/features/catalog/selectors';
import { FilterDropdownMenu } from './FilterDropdownMenu';
import type {
  CatalogFilterState,
  CatalogMultiselectKey,
} from '../../hooks/filterState';

interface Props {
  filters: CatalogFilterState;
  total: number;
  toggleFilter: (key: CatalogMultiselectKey, value: string) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const EMPTY_OPTIONS: FilterOptionsVM = {
  macroGroups: [],
  subGroups: [],
  abilityTaxons: [],
  taskTypes: [],
  modalities: [],
  languages: [],
  difficulties: [],
  capabilities: [],
  domains: [],
  subdomains: [],
  skills: [],
  abilityTags: [],
};

export const FilterPanel = ({
  filters,
  total,
  toggleFilter,
  resetFilters,
  activeFilterCount,
}: Props) => {
  const { t, lang } = useApp();
  const { data: rawOptions } = useFilterOptionsQuery();

  const options = useMemo<FilterOptionsVM>(
    () => (rawOptions ? selectFilterOptionsVM(rawOptions, lang) : EMPTY_OPTIONS),
    [rawOptions, lang],
  );

  // Cascade subGroup options by selected macroGroupIds (BE-provided parent FK).
  const subGroupOptions = useMemo(
    () =>
      filters.macroGroupIds.length === 0
        ? options.subGroups
        : options.subGroups.filter((sg) =>
          filters.macroGroupIds.includes(sg.parentId),
        ),
    [options.subGroups, filters.macroGroupIds],
  );

  // Cascade subdomain options by selected domainIds.
  const subdomainOptions = useMemo(
    () =>
      filters.domainIds.length === 0
        ? options.subdomains
        : options.subdomains.filter((sd) =>
          filters.domainIds.includes(sd.parentId),
        ),
    [options.subdomains, filters.domainIds],
  );

  return (
    <div
      className="rounded-xl mb-6"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className="flex items-center gap-1.5 text-xs font-medium mr-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SlidersHorizontal size={13} />
            {t.catalogue.filters}
          </span>

          <FilterDropdownMenu
            label={t.catalogue.macroGroup}
            options={options.macroGroups}
            selected={filters.macroGroupIds}
            onToggle={(v) => toggleFilter('macroGroupIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.subGroup}
            options={subGroupOptions}
            selected={filters.subGroupIds}
            onToggle={(v) => toggleFilter('subGroupIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.abilityTaxon}
            options={options.abilityTaxons}
            selected={filters.abilityTaxonIds}
            onToggle={(v) => toggleFilter('abilityTaxonIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.abilityTag}
            options={options.abilityTags}
            selected={filters.abilityTags}
            onToggle={(v) => toggleFilter('abilityTags', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.skill}
            options={options.skills}
            selected={filters.skills}
            onToggle={(v) => toggleFilter('skills', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.taskType}
            options={options.taskTypes}
            selected={filters.taskTypeIds}
            onToggle={(v) => toggleFilter('taskTypeIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.modality}
            options={options.modalities}
            selected={filters.modalityIds}
            onToggle={(v) => toggleFilter('modalityIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.language}
            options={options.languages}
            selected={filters.languageIds}
            onToggle={(v) => toggleFilter('languageIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.difficulty}
            options={options.difficulties}
            selected={filters.difficultyIds}
            onToggle={(v) => toggleFilter('difficultyIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.capabilitiesSection}
            options={options.capabilities}
            selected={filters.capabilityIds}
            onToggle={(v) => toggleFilter('capabilityIds', v)}
          />
          <FilterDropdownMenu
            label={t.catalogue.domain}
            options={options.domains}
            selected={filters.domainIds}
            onToggle={(v) => toggleFilter('domainIds', v)}
          />
          {subdomainOptions.length > 0 && (
            <FilterDropdownMenu
              label={t.catalogue.subdomain}
              options={subdomainOptions}
              selected={filters.subdomainIds}
              onToggle={(v) => toggleFilter('subdomainIds', v)}
            />
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ml-1"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <IconX size={11} />
              {t.catalogue.resetFilters}
            </button>
          )}
        </div>
      </div>

      <div
        className="px-4 py-2.5 flex items-center justify-end"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatBenchmarkCount(t, lang, total)}
        </span>
      </div>

      {activeFilterCount > 0 && (
        <ActiveChips
          filters={filters}
          options={options}
          toggleFilter={toggleFilter}
        />
      )}
    </div>
  );
};
