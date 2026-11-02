import { useEffect } from 'react';

const STORAGE_KEY = 'gab_theme';
const theme = 'dark' as const;

// The conference build currently supports only the reference's dark theme.
document.documentElement.setAttribute('data-theme', theme);

export function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, []);

  return { theme };
}
