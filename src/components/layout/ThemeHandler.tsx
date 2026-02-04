
"use client"

import { useEffect } from 'react';
import { useUIStore } from '@/app/lib/store';

export function ThemeHandler() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return null;
}
