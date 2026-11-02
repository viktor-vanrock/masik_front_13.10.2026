import { X as IconX } from 'lucide-react';
import type {
  CatalogFilterState,
  CatalogMultiselectKey,
} from '@/pages/BenchmarksCatalogue/hooks/filterState';
import type { FilterOptionsVM } from '@/features/catalog/selectors';

interface Props {
  filters: CatalogFilterState;
  options: FilterOptionsVM;
  toggleFilter: (key: CatalogMultiselectKey, value: string) => void;
}

const CHIP_KEYS = [
  'macroGroupIds',
  'subGroupIds',
  'abilityTaxonIds',
  'taskTypeIds',
  'modalityIds',
  'languageIds',
  'difficultyIds',
  'capabilityIds',
  'domainIds',
  'subdomainIds',
  'skills',
  'abilityTags',
] as const satisfies readonly CatalogMultiselectKey[];

const KEY_TO_OPTIONS: Record<(typeof CHIP_KEYS)[number], keyof FilterOptionsVM> = {
  macroGroupIds: 'macroGroups',
  subGroupIds: 'subGroups',
  abilityTaxonIds: 'abilityTaxons',
  taskTypeIds: 'taskTypes',
  modalityIds: 'modalities',
  languageIds: 'languages',
  difficultyIds: 'difficulties',
  capabilityIds: 'capabilities',
  domainIds: 'domains',
  subdomainIds: 'subdomains',
  skills: 'skills',
  abilityTags: 'abilityTags',
};

function labelOf(
  value: string,
  key: (typeof CHIP_KEYS)[number],
  options: FilterOptionsVM,
): string {
  const bucket = options[KEY_TO_OPTIONS[key]];
  const found = bucket.find((o) => o.value === value);
  return found?.label ?? value;
}

export function ActiveChips({ filters, options, toggleFilter }: Props) {
  const chips: { label: string; remove: () => void }[] = [];

  for (const key of CHIP_KEYS) {
    const values = filters[key];
    for (const value of values) {
      chips.push({
        label: labelOf(value, key, options),
        remove: () => toggleFilter(key, value),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="px-4 py-2 flex flex-wrap gap-1.5"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'var(--bg-blue-tint)',
            color: 'var(--text-blue-on-bg)',
          }}
        >
          {chip.label}
          <button onClick={chip.remove} className="transition-colors">
            <IconX size={9} />
          </button>
        </span>
      ))}
    </div>
  );
}
