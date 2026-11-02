import { X } from "lucide-react";
import { FILTER_LABELS } from "../consts";
import type { CatalogFilterKey, CatalogFilterValues } from "../types";

export function AppliedFilterChips({ filters, onRemove, onClear }: { filters: CatalogFilterValues; onRemove: (key: CatalogFilterKey, value: string) => void; onClear: () => void }) {
  const chips = (Object.keys(FILTER_LABELS) as CatalogFilterKey[]).flatMap((key) => filters[key].map((value) => ({ key, value })));
  if (!chips.length) return null;
  return <div className="mb-5 mt-0 flex flex-wrap items-center gap-[7px]" aria-label="Применённые фильтры">
    {chips.map(({ key, value }) => <button key={`${key}:${value}`} type="button" title="Убрать фильтр" onClick={() => onRemove(key, value)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#d7dbe5] bg-white px-[9px] py-[5px] text-[11px] text-[#3a427b] transition hover:border-[#afb4d9] hover:bg-[#eeeff7]">
      <span>{value}</span><X size={12} aria-hidden="true" />
    </button>)}
    <button type="button" onClick={onClear} className="cursor-pointer border-0 bg-transparent px-1.5 py-[5px] text-[11px] text-[#686e78] hover:text-[#3a427b]">Сбросить всё</button>
  </div>;
}