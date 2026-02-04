
"use client"

import { useEffect } from 'react';
import { useStore } from '@/app/lib/store';

export function LanguageHandler() {
  const store = useStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lang = store.language || 'en';
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      if (lang === 'ar') {
        document.body.classList.add('font-arabic');
      } else {
        document.body.classList.remove('font-arabic');
      }
    }
  }, [store.language]);

  return null;
}
