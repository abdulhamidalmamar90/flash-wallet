
"use client"

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

interface UIState {
  language: Language;
  theme: Theme;
  isScannerOpen: boolean;
  toggleLanguage: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setScannerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en', // Changed default to English
      theme: 'dark',
      isScannerOpen: false,
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'ar' : 'en' 
      })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      setScannerOpen: (open) => set({ isScannerOpen: open }),
    }),
    {
      name: 'flash-ui-storage',
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    }
  )
);

export const useStore = () => {
  const { 
    language, 
    theme, 
    isScannerOpen, 
    toggleLanguage, 
    toggleTheme, 
    setTheme, 
    setScannerOpen 
  } = useUIStore();
  
  return { language, theme, isScannerOpen, toggleLanguage, toggleTheme, setTheme, setScannerOpen };
};
