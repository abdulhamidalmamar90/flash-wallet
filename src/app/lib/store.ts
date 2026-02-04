
"use client"

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

interface UIState {
  language: Language;
  theme: Theme;
  toggleLanguage: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'ar',
      theme: 'dark',
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'ar' : 'en' 
      })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
    }),
    {
      name: 'flash-ui-storage',
    }
  )
);

export const useStore = () => {
  const { language, theme, toggleLanguage, toggleTheme, setTheme } = useUIStore();
  return { language, theme, toggleLanguage, toggleTheme, setTheme };
};

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'withdraw' | 'purchase';
  amount: number;
  recipient?: string;
  service?: string;
  status: 'completed' | 'pending' | 'rejected';
  date: string;
}
