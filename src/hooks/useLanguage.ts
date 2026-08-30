'use me';
'use client';

import { useState, useEffect } from 'react';

export type Language = 'id' | 'en';

const STORAGE_KEY = 'metix_lang';

export function useLanguage(defaultLang: Language = 'id') {
  const [lang, setLangState] = useState<Language>(defaultLang);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
        setLangState(savedLang);
      }
    }
  }, []);

  // Update language and sync localStorage
  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new Event('metix_lang_change'));
    }
  };

  // Sync across tabs and page updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
        setLangState(savedLang);
      }
    };

    window.addEventListener('metix_lang_change', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('metix_lang_change', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { lang, setLang };
}
