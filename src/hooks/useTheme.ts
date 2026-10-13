import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gab_theme';

// Apply theme immediately to avoid flash on first render
const initialTheme = (() => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return (stored as 'light' | 'dark') || 'light';
})();
document.documentElement.setAttribute('data-theme', initialTheme);

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
