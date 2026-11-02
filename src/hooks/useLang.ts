import { useState } from 'react';
import type { Lang } from '../i18n';
import { translations } from '../i18n';

const STORAGE_KEY = 'mas_catalogue_lang';

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Lang) || 'ru';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = translations[lang];

  return { lang, setLang, t };
}
