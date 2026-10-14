import { useState, useEffect } from 'react';

// const STORAGE_KEY = 'gab_theme'; // Existing persisted preference key retained for re-enabling.

// Theme switching is temporarily disabled; always start with the light theme.
const initialTheme: 'light' | 'dark' = 'light';
// Previous persisted theme selection is kept here for possible re-enabling:
// const initialTheme = (() => {
//   const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
//   return (stored as 'light' | 'dark') || 'light';
// })();
document.documentElement.setAttribute('data-theme', initialTheme);

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    // Keep the app light even when an old gab_theme=dark value exists.
    document.documentElement.setAttribute('data-theme', 'light');
    // Previous persistence behavior is kept commented out:
    // document.documentElement.setAttribute('data-theme', theme);
    // localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Theme toggle is temporarily disabled. Keep the handler for existing context consumers.
  const toggleTheme = () => setTheme('light');
  // Previous theme toggle behavior:
  // const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
}
