import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { pluralRu } from '../utils';
import type { CatalogFilterKey, CatalogFilterOptions, CatalogFilterValues } from '../types';

type Props = {
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  resultCount: number;
  isCountPending: boolean;
  suiteSearch: string;
  onSuiteSearchChange: (value: string) => void;
  filterOptions: CatalogFilterOptions;
  selected: CatalogFilterValues;
  onToggle: (key: CatalogFilterKey, value: string) => void;
  facetCounts?: Partial<Record<CatalogFilterKey, Record<string, number>>>;
};

const matches = (value: string, query: string) => value.toLocaleLowerCase('ru').includes(query);

function focusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), summary')]
    .filter((element) => {
      if (element.closest('[hidden]')) return false;
      for (let parent = element.parentElement; parent && parent !== container; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement && !parent.open
          && !parent.querySelector(':scope > summary')?.contains(element)) return false;
        if (window.getComputedStyle(parent).display === 'none') return false;
      }
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

export function FilterDrawer({ onClose, onReset, onApply, resultCount, isCountPending, suiteSearch,
  onSuiteSearchChange, filterOptions, selected, onToggle, facetCounts }: Props) {
  const [listSearch, setListSearch] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const closeOnEscape = useEffectEvent(onClose);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const body = document.body;
    const root = document.documentElement;
    const previousBodyStyles = { position: body.style.position, top: body.style.top, left: body.style.left,
      right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    const previousRootStyles = { overflow: root.style.overflow, overscrollBehavior: root.style.overscrollBehavior };
    Object.assign(body.style, { position: 'fixed', top: `-${scrollY}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' });
    Object.assign(root.style, { overflow: 'hidden', overscrollBehavior: 'none' });
    closeRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeOnEscape(); }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = focusableElements(drawerRef.current);
      const first = focusable[0];
      const last = focusable.at(-1);
      if ((event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !drawerRef.current?.contains(event.target)) closeRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', containFocus);
      Object.assign(body.style, previousBodyStyles);
      Object.assign(root.style, previousRootStyles);
      window.scrollTo(0, scrollY);
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const heading = (label: string, keys: CatalogFilterKey[]) => {
    const count = keys.reduce((total, key) => total + selected[key].length, 0);
    return <h4 className="fgroup-t">{label}{count > 0 && <small>выбрано {count}</small>}</h4>;
  };
  const searchField = (key: CatalogFilterKey, label: string, placeholder = 'Найти значение') => (
    <label className="search fsearch">
      <span className="sr-only">{label}: поиск</span><Search aria-hidden="true" />
      <input className="input" type="search" placeholder={placeholder}
        value={key === 'suites' ? suiteSearch : listSearch[key] ?? ''}
        onChange={(event) => key === 'suites' ? onSuiteSearchChange(event.target.value)
          : setListSearch((current) => ({ ...current, [key]: event.target.value }))} />
    </label>
  );
  const row = (key: CatalogFilterKey, value: string, className = '', hidden = false) => {
    const checked = selected[key].includes(value);
    const count = facetCounts?.[key]?.[value];
    return <label key={value} className={`frow${className ? ` ${className}` : ''}`} hidden={hidden}>
      <input className="cbx" type="checkbox" checked={checked} disabled={count === 0 && !checked}
        onChange={() => onToggle(key, value)} /><span>{value}</span>{count !== undefined && <em>{count}</em>}
    </label>;
  };
  const listGroup = (key: CatalogFilterKey, label: string) => {
    const query = (key === 'suites' ? suiteSearch : listSearch[key] ?? '').trim().toLocaleLowerCase('ru');
    const options = filterOptions[key];
    const hasMatches = options.some((option) => matches(option, query));
    return <div className="fgroup">{heading(label, [key])}{searchField(key, label)}
      <div className="flist">{options.map((option) => row(key, option, '', !matches(option, query)))}
        <p className="fnone" hidden={hasMatches}>Ничего не найдено</p>
      </div>
    </div>;
  };
  const chipGroup = (key: CatalogFilterKey, label: string) => (
    <div className="fgroup">{heading(label, [key])}<div className="opts">
      {filterOptions[key].map((value) => {
        const checked = selected[key].includes(value);
        const count = facetCounts?.[key]?.[value];
        return <button key={value} className="opt" type="button" aria-pressed={checked}
          disabled={count === 0 && !checked} onClick={() => onToggle(key, value)}>
          {value}{count !== undefined && <em>{count}</em>}
        </button>;
      })}
    </div></div>
  );
  const treeGroup = (parentKey: CatalogFilterKey, childKey: CatalogFilterKey, label: string,
    childrenByParent: Record<string, string[]>) => {
    const query = (listSearch[parentKey] ?? '').trim().toLocaleLowerCase('ru');
    let hasMatches = false;
    return <div className="fgroup">{heading(label, [parentKey, childKey])}
      {searchField(parentKey, label, 'Найти раздел или подраздел')}
      <div className="flist ftree">{filterOptions[parentKey].map((parent) => {
        const children = childrenByParent[parent] ?? [];
        const parentMatches = matches(parent, query);
        const childMatches = children.some((child) => matches(child, query));
        const visible = parentMatches || childMatches;
        hasMatches ||= visible;
        const id = `${parentKey}:${parent}`;
        const open = expanded.has(id) || children.some((child) => selected[childKey].includes(child));
        const force = Boolean(query && childMatches);
        return <div key={parent} className={`tnode${open ? ' open' : ''}${force ? ' force' : ''}`} hidden={!visible}>
          {children.length > 0 ? <button className="texp" type="button" aria-expanded={open || force}
            aria-label={`${open || force ? 'Свернуть' : 'Развернуть'} «${parent}»`}
            onClick={() => setExpanded((current) => {
              const next = new Set(current);
              if (next.has(id)) next.delete(id); else next.add(id);
              return next;
            })}><ChevronDown aria-hidden="true" /></button> : <span className="texp-sp" />}
          {row(parentKey, parent, 'tparent')}
          {children.length > 0 && <div className="tkids" hidden={!open && !force}>{children.map((child) => row(childKey, child, '', !parentMatches && !matches(child, query)))}</div>}
        </div>;
      })}<p className="fnone" hidden={hasMatches}>Ничего не найдено</p></div>
    </div>;
  };

  return createPortal(<div className="bf-theme bf-app">
    <div className="scrim" onClick={onClose} aria-hidden="true" />
    <div className="drawer" id="catalog-filter-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="drawer-head"><div><h2 id={titleId}>Фильтры</h2><p>Поиск выполняется по отдельным тестам внутри наборов.</p></div>
        <button className="icon-btn" type="button" ref={closeRef} aria-label="Закрыть" onClick={onClose}><X aria-hidden="true" /></button>
      </div>
      <div className="drawer-body">
        <section className="fsec"><h3>Основные</h3>{listGroup('suites', 'Набор')}
          {chipGroup('language', 'Язык')}{chipGroup('modality', 'Модальность')}{chipGroup('taskType', 'Тип задачи')}
          {chipGroup('difficulty', 'Сложность')}{chipGroup('capability', 'Возможности')}
        </section>
        <details className="fdet" open><summary>Область и специализация<ChevronDown aria-hidden="true" /></summary>
          {treeGroup('domain', 'subdomain', 'Домен и поддомен', filterOptions.domainChildren)}
        </details>
        <details className="fdet"><summary>Классификация способностей<ChevronDown aria-hidden="true" /></summary>
          {treeGroup('macroGroup', 'subGroup', 'Группы способностей', filterOptions.macroChildren)}
          {listGroup('abilityTaxon', 'Конкретные способности')}
          <details className="fdet-n"><summary><ChevronRight aria-hidden="true" />Детальные теги способности</summary>{listGroup('abilityTag', 'Теги')}</details>
        </details>
      </div>
      <div className="drawer-foot"><button className="btn btn-secondary" type="button" onClick={onReset}>Сбросить</button>
        <button className="btn btn-primary" type="button" disabled={isCountPending} onClick={onApply}>
          {isCountPending ? 'Показать…' : `Показать ${resultCount} ${pluralRu(resultCount, ['тест', 'теста', 'тестов'])}`}
        </button>
      </div>
    </div>
  </div>, document.body);
}
