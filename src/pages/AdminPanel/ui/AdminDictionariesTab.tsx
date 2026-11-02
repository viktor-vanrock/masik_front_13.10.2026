import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { DICTIONARY_TYPES_BY_CATEGORY } from '@/types';
import { DictionaryContent } from '@/pages/AdminSettings/ui/DictionaryContent';
import type { DictionaryCategory } from '@/types';

type CategoryKey = keyof typeof DICTIONARY_TYPES_BY_CATEGORY;

interface SelectedPair {
  category: DictionaryCategory;
  type: string;
}

export function AdminDictionariesTab() {
  const { t } = useApp();
  const s = t.admin.settings.dictionaries;
  const [selected, setSelected] = useState<SelectedPair | null>(null);

  const typeLabel: Partial<Record<string, string>> = {
    'macro-groups': t.catalogue.macroGroup,
    'sub-groups': t.catalogue.subGroup,
    'ability-taxons': t.catalogue.abilityTaxon,
    'task-types': t.catalogue.taskType,
    'modalities': t.catalogue.modality,
    'languages': t.catalogue.language,
    'difficulties': t.catalogue.difficulty,
    'capabilities': t.catalogue.capabilitiesSection,
    'domains': t.catalogue.domain,
    'subdomains': t.catalogue.subdomain,
  };

  if (selected) {
    return (
      <DictionaryContent
        category={selected.category}
        type={selected.type}
        onBack={() => setSelected(null)}
      />
    );
  }

  const groups: Array<{ category: CategoryKey; label: string }> = [
    { category: 'taxonomy', label: s.taxonomy },
    { category: 'parameters', label: s.parameters },
    { category: 'domains', label: s.domains },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {s.title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {s.subtitle}
        </p>
      </div>

      {groups.map(({ category, label }) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            {label}
          </h3>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {(DICTIONARY_TYPES_BY_CATEGORY[category] as readonly string[]).map((dictType, idx, arr) => (
              <button
                key={dictType}
                type="button"
                onClick={() => setSelected({ category, type: dictType })}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <span className="text-sm">{typeLabel[dictType] ?? dictType}</span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
