import { useEffect, useState } from 'react';

const FALLBACK_COLOR = '#000000';

function readColors(names: readonly string[]): string[] {
  if (typeof window === 'undefined') {
    return names.map(() => FALLBACK_COLOR);
  }
  const computed = getComputedStyle(document.documentElement);
  return names.map(
    (name) => computed.getPropertyValue(name).trim() || FALLBACK_COLOR
  );
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useCssColors(variableNames: readonly string[]): string[] {
  const [colors, setColors] = useState<string[]>(() => readColors(variableNames));

  useEffect(() => {
    const update = () => {
      setColors((prev) => {
        const next = readColors(variableNames);
        return arraysEqual(prev, next) ? prev : next;
      });
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [variableNames]);

  return colors;
}