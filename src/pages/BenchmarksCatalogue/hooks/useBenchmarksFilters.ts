import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import type { BenchmarkTestListQuery } from '@/types';
import {
  CATALOG_MULTISELECT_KEYS,
  CASCADE_RESETS,
  DEFAULT_CATALOG_FILTERS,
  buildSearchParamsFromFilterState,
  canonicalSearchString,
  countActiveFilters,
  filterStateToQuery,
  parseFilterStateFromSearch,
  type CatalogFilterState,
  type CatalogMultiselectKey,
} from './filterState';

const SEARCH_DEBOUNCE_MS = 300;

export interface UseBenchmarksFiltersResult {
  filters: CatalogFilterState;
  query: BenchmarkTestListQuery;
  toggleFilter: (key: CatalogMultiselectKey, value: string) => void;
  updateFilter: <K extends keyof CatalogFilterState>(
    key: K,
    value: CatalogFilterState[K],
  ) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

/**
 * URL is source of truth for every filter except `search`, which is a
 * locally-controlled input value debounced 300ms before being written
 * back to URL. External URL changes (Back/Forward/deep link) resync
 * local `search` via a "last written" guard.
 */
export function useBenchmarksFilters(): UseBenchmarksFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedFromUrl = useMemo(
    () => parseFilterStateFromSearch(searchParams),
    [searchParams],
  );
  const urlSearch = parsedFromUrl.search;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const lastWrittenSearchRef = useRef(urlSearch);

  // External URL change → resync local search input.
  useEffect(() => {
    if (urlSearch !== lastWrittenSearchRef.current) {
      setSearchInput(urlSearch);
      lastWrittenSearchRef.current = urlSearch;
    }
  }, [urlSearch]);

  const writeParams = useCallback(
    (next: URLSearchParams) => {
      if (canonicalSearchString(next) === canonicalSearchString(searchParams)) {
        return;
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Debounced search → URL.
  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const nextState: CatalogFilterState = {
      ...parsedFromUrl,
      search: debouncedSearch,
    };
    const nextParams = buildSearchParamsFromFilterState(
      nextState,
      debouncedSearch,
    );
    lastWrittenSearchRef.current = debouncedSearch;
    writeParams(nextParams);
  }, [debouncedSearch, urlSearch, parsedFromUrl, writeParams]);

  // Public filter state — URL-derived everywhere except `search` (local).
  const filters = useMemo<CatalogFilterState>(
    () => ({ ...parsedFromUrl, search: searchInput }),
    [parsedFromUrl, searchInput],
  );

  const commitState = useCallback(
    (nextState: CatalogFilterState) => {
      // Use current `searchInput` so filter mutations commit any
      // in-flight typed search instead of dropping it.
      const nextParams = buildSearchParamsFromFilterState(
        nextState,
        searchInput,
      );
      lastWrittenSearchRef.current = searchInput;
      writeParams(nextParams);
    },
    [searchInput, writeParams],
  );

  const applyCascade = useCallback(
    (key: keyof CatalogFilterState, state: CatalogFilterState) => {
      const resets =
        CASCADE_RESETS[key as keyof typeof CASCADE_RESETS] ?? null;
      if (!resets) return state;
      const next = { ...state };
      for (const child of resets) next[child] = [];
      return next;
    },
    [],
  );

  const toggleFilter = useCallback(
    (key: CatalogMultiselectKey, value: string) => {
      const current = parsedFromUrl[key];
      const nextArr = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const nextState = applyCascade(key, {
        ...parsedFromUrl,
        [key]: nextArr,
      });
      commitState(nextState);
    },
    [parsedFromUrl, applyCascade, commitState],
  );

  const updateFilter = useCallback(
    <K extends keyof CatalogFilterState>(
      key: K,
      value: CatalogFilterState[K],
    ) => {
      if (key === 'search') {
        setSearchInput(value as string);
        return;
      }
      const nextState = applyCascade(key, {
        ...parsedFromUrl,
        [key]: value,
      });
      commitState(nextState);
    },
    [parsedFromUrl, applyCascade, commitState],
  );

  const resetFilters = useCallback(() => {
    setSearchInput('');
    lastWrittenSearchRef.current = '';
    writeParams(
      buildSearchParamsFromFilterState(DEFAULT_CATALOG_FILTERS, ''),
    );
  }, [writeParams]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  // Query for RQ uses the debounced search — list refetch fires only after
  // typing settles, not on every keystroke.
  const query = useMemo<BenchmarkTestListQuery>(
    () => filterStateToQuery(parsedFromUrl, debouncedSearch),
    [parsedFromUrl, debouncedSearch],
  );

  return {
    filters,
    query,
    toggleFilter,
    updateFilter,
    resetFilters,
    activeFilterCount,
  };
}

export { CATALOG_MULTISELECT_KEYS };
