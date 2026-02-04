
"use client"

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ar';

interface UIState {
  language: Language;
  toggleLanguage: () => void;
}

// Store only handles persistent UI state like language
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'ar',
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'ar' : 'en' 
      })),
    }),
    {
      name: 'flash-ui-storage',
    }
  )
);

// Compatibility hook for existing components
export const useStore = () => {
  const { language, toggleLanguage } = useUIStore();
  return { language, toggleLanguage };
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

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  type: 'bank' | 'crypto';
  amount: number;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}
