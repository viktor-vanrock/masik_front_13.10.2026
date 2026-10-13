import { useEffect, useState } from 'react';

/**
 * Debounce произвольного значения. Возвращает значение, обновлённое
 * через `delay` мс после последнего изменения.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
