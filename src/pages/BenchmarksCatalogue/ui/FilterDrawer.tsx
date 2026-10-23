import { useEffect, useEffectEvent, useState } from 'react';
import { Search, X } from 'lucide-react';
import { pluralRu } from '../utils';
import type { CatalogFilterKey, CatalogFilterOptions, CatalogFilterValues } from '../types';

export function FilterDrawer({ onClose, onReset, onApply, resultCount, isCountPending, suiteSearch, onSuiteSearchChange, filterOptions, selected, onToggle }: { onClose: () => void; onReset: () => void; onApply: () => void; resultCount: number; isCountPending: boolean; suiteSearch: string; onSuiteSearchChange: (value: string) => void; filterOptions: CatalogFilterOptions; selected: CatalogFilterValues; onToggle: (key: CatalogFilterKey, value: string) => void }) {
  const [listSearch, setListSearch] = useState<Record<string, string>>({});
  const closeOnEscape = useEffectEvent(onClose);
  const selectedCount = Object.values(selected).reduce((sum, values) => sum + values.length, 0);
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousRootStyles = {
      overflow: root.style.overflow,
      overscrollBehavior: root.style.overscrollBehavior,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOnEscape();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      Object.assign(body.style, previousBodyStyles);
      Object.assign(root.style, previousRootStyles);
      window.scrollTo(0, scrollY);
    };
  }, []);
  const searchable = (key: CatalogFilterKey, placeholder: string, value = listSearch[key] ?? '', onChange = (next: string) => setListSearch((current) => ({ ...current, [key]: next }))) => <label className="relative mb-2 block"><Search size={16} className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-[#686e78]" /><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-10 w-full rounded-[10px] border border-[#d1d7de] bg-white pl-[42px] pr-3 text-[12px] outline-none transition placeholder:text-[#8b929b] focus:border-[#515dad]" /></label>;
  const optionList = (key: CatalogFilterKey, options: string[], query = listSearch[key] ?? '') => {
    const q = query.trim().toLocaleLowerCase('ru');
    const matched = options.filter((option) => !q || option.toLocaleLowerCase('ru').includes(q));
    return <div className="grid max-h-[210px] gap-px overflow-auto rounded-[10px] border border-[#e9edf2] bg-white p-[5px]">{matched.length ? matched.map((option) => <label key={option} className={`flex cursor-pointer items-start gap-[9px] rounded-[7px] px-2 py-[7px] text-[11px] leading-[1.4] ${selected[key].includes(option) ? 'bg-[#eeeff7] text-[#3a427b]' : 'hover:bg-[#f7f8fb]'}`}><input type="checkbox" checked={selected[key].includes(option)} onChange={() => onToggle(key, option)} className="mt-[1px] h-[15px] w-[15px] accent-[#3a427b]" /><span>{option}</span></label>) : <div className="p-2.5 text-[11px] text-[#686e78]">Нет значений</div>}</div>;
  };
  const chips = (key: CatalogFilterKey, options: string[]) => <div className="flex flex-wrap gap-[7px]">{options.map((option) => <label key={option} className="relative cursor-pointer"><input type="checkbox" checked={selected[key].includes(option)} onChange={() => onToggle(key, option)} className="peer absolute h-px w-px opacity-0" /><span className="inline-flex min-h-8 items-center rounded-full border border-[#e9edf2] bg-white px-[10px] py-1.5 text-[11px] text-[#686e78] transition peer-checked:border-[#afb4d9] peer-checked:bg-[#eeeff7] peer-checked:font-medium peer-checked:text-[#3a427b]">{option}</span></label>)}</div>;
  const filterField = (key: CatalogFilterKey, label: string, options: string[], searchableOptions = false) => <div className="mt-[18px]"><div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-[550]"><span>{label}</span>{selected[key].length > 0 && <small className="text-[10px] font-normal text-[#686e78]">Выбрано: {selected[key].length}</small>}</div>{searchableOptions && searchable(key, 'Найти значение')}{searchableOptions ? optionList(key, options) : chips(key, options)}</div>;
  const hierarchical = (parentKey: CatalogFilterKey, childKey: CatalogFilterKey, parentOptions: string[], childrenByParent: Record<string, string[]>, childLabel: string) => {
    const q = (listSearch[parentKey] ?? '').trim().toLocaleLowerCase('ru');
    const parents = parentOptions.filter((parent) => !q || parent.toLocaleLowerCase('ru').includes(q) || (childrenByParent[parent] ?? []).some((child) => child.toLocaleLowerCase('ru').includes(q)));
    return <div><div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-[550]"><span>{childLabel}</span>{selected[parentKey].length > 0 && <small className="text-[10px] font-normal text-[#686e78]">Выбрано: {selected[parentKey].length}</small>}</div>{searchable(parentKey, 'Найти раздел или подраздел')}<div className="grid max-h-[270px] gap-1.5 overflow-auto rounded-[10px] border border-[#e9edf2] p-[7px]">{parents.length ? parents.map((parent) => { const allChildren = childrenByParent[parent] ?? []; const parentMatches = !q || parent.toLocaleLowerCase('ru').includes(q); const childOptions = parentMatches ? allChildren : allChildren.filter((child) => child.toLocaleLowerCase('ru').includes(q)); return <details key={parent} open className="group/tree m-0 rounded-[8px] bg-white"><summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-start gap-2 rounded-[8px] p-2 text-[11px] hover:bg-[#f7f8fb] group-open/tree:bg-[#fafbfc] [&::-webkit-details-marker]:hidden"><span className="inline-block origin-center text-[14px] leading-[15px] text-[#686e78] transition-transform group-open/tree:rotate-90">›</span><label className={`flex cursor-pointer items-start gap-[9px] rounded-[7px] px-2 py-[7px] text-[11px] leading-[1.4] ${selected[parentKey].includes(parent) ? 'bg-[#eeeff7] text-[#3a427b]' : 'hover:bg-[#f7f8fb]'}`} onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected[parentKey].includes(parent)} onChange={() => onToggle(parentKey, parent)} className="mt-[1px] h-[15px] w-[15px] accent-[#3a427b]" /><span>{parent}</span></label><small className="text-[12px]">{allChildren.length || ''}</small></summary>{childOptions.length > 0 && <div className="ml-7 mt-0.5 mb-1.5 grid gap-px border-l border-[#e9edf2] pl-[9px]">{childOptions.map((child) => <label key={child} className={`flex cursor-pointer items-start gap-[9px] rounded-[7px] px-2 py-1.5 text-[11px] leading-[1.4] ${selected[childKey].includes(child) ? 'bg-[#eeeff7] text-[#3a427b]' : 'hover:bg-[#f7f8fb]'}`}><input type="checkbox" checked={selected[childKey].includes(child)} onChange={() => onToggle(childKey, child)} className="mt-[1px] h-[15px] w-[15px] accent-[#3a427b]" /><span>{child}</span></label>)}</div>}</details>; }) : <div className="p-2.5 text-[11px] text-[#686e78]">Нет значений</div>}</div></div>;
  };
  return <div className="fixed inset-0 z-[79]" role="presentation">
    <button type="button" aria-label="Закрыть фильтры" className="absolute inset-0 h-full w-full bg-[#17213a24] backdrop-blur-[1px]" onClick={onClose} />
    <aside id="catalog-filter-drawer" aria-label="Фильтры каталога" aria-modal="true" role="dialog" className="absolute inset-y-0 right-0 z-[80] flex w-[min(560px,calc(100vw-32px))] flex-col border-l border-[#e9edf2] bg-white shadow-[-22px_0_70px_rgba(23,33,58,.122)] max-[760px]:w-screen">
      <header className="flex items-start justify-between gap-5 border-b border-[#e9edf2] px-6 pb-[18px] pt-[22px] max-[760px]:px-[18px]">
        <div><h2 className="text-[24px] font-medium tracking-[-.6px]">Фильтры</h2><p className="mt-1 text-[11px] text-[#686e78]">Поиск выполняется по отдельным тестам внутри наборов.</p></div>
        <button type="button" aria-label="Закрыть" onClick={onClose} className="grid h-[38px] w-[38px] shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[#e9edf2] bg-white text-[#686e78] transition hover:bg-[#f3f6fa]"><X size={18} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-7 pt-1 max-[760px]:px-[18px]">
        <section className="border-b border-[#e9edf2] py-5"><h3 className="mb-[14px] text-[15px] font-medium">Основные</h3>
          <div><div className="mb-2 flex items-center justify-between gap-3 text-[12px] font-[550]"><span>Набор</span>{selected.suites.length > 0 && <small className="text-[10px] font-normal text-[#686e78]">Выбрано: {selected.suites.length}</small>}</div>{searchable('suites', 'Найти значение', suiteSearch, onSuiteSearchChange)}{optionList('suites', filterOptions.suites, suiteSearch)}</div>
          {filterField('language', 'Язык', filterOptions.language)}{filterField('modality', 'Модальность', filterOptions.modality)}{filterField('taskType', 'Тип задачи', filterOptions.taskType)}{filterField('difficulty', 'Сложность', filterOptions.difficulty)}{filterField('capability', 'Возможности', filterOptions.capability)}
        </section>
        <details open className="group/section border-b border-[#e9edf2]"><summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">Область и специализация<span aria-hidden="true" className="inline-block origin-center rotate-90 text-[20px] leading-none text-[#686e78] transition-transform group-open/section:-rotate-90">›</span></summary><div className="pb-5">{hierarchical('domain', 'subdomain', filterOptions.domain, filterOptions.domainChildren, 'Домен и поддомен')}</div></details>
        <details className="group/section border-b border-[#e9edf2]"><summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">Классификация способностей<span aria-hidden="true" className="inline-block origin-center rotate-90 text-[20px] leading-none text-[#686e78] transition-transform group-open/section:-rotate-90">›</span></summary><div className="pb-5">{hierarchical('macroGroup', 'subGroup', filterOptions.macroGroup, filterOptions.macroChildren, 'Группы способностей')}{filterField('abilityTaxon', 'Конкретные способности', filterOptions.abilityTaxon, true)}<details className="mt-3 rounded-[10px] border border-[#e9edf2] px-3"><summary className="cursor-pointer py-3 text-[11px] text-[#3a427b]">Детальные теги способности</summary><div className="pb-3">{filterField('abilityTag', 'Теги', filterOptions.abilityTag, true)}</div></details></div></details>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-[#e9edf2] bg-white px-6 py-4 max-[760px]:px-[18px]">
        <button type="button" onClick={onReset} disabled={selectedCount === 0} className="inline-flex items-center justify-center gap-[10px] rounded-[30px] border border-transparent bg-[#9097a126] px-3 py-2 text-[12px] font-[450] leading-5 text-[#1e1e20] transition hover:bg-[#9097a140] disabled:cursor-not-allowed disabled:opacity-50">Сбросить</button>
        <button type="button" onClick={onApply} disabled={isCountPending} className="inline-flex min-h-10 min-w-[190px] cursor-pointer items-center justify-center rounded-[30px] border border-transparent bg-[#515dad] px-4 text-[12px] font-medium text-white transition hover:bg-[#465195] disabled:cursor-wait disabled:opacity-70 max-[760px]:min-w-0 max-[760px]:flex-1">{isCountPending ? 'Показать…' : `Показать ${resultCount} ${pluralRu(resultCount, ['тест', 'теста', 'тестов'])}`}</button>
      </footer>
    </aside>
  </div>;
}
