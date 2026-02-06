"use client"

import { useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme, language } = useStore();
  
  return (
    <button 
      onClick={toggleTheme}
      className="w-full h-14 glass-card rounded-2xl flex items-center justify-between px-6 hover:border-primary transition-all group"
    >
      <div className="flex items-center gap-4">
        {theme === 'dark' ? (
          <Moon size={18} className="text-secondary" />
        ) : (
          <Sun size={18} className="text-primary" />
        )}
        <span className="text-[10px] font-headline font-bold uppercase tracking-widest">
          {language === 'ar' 
            ? (theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري') 
            : (theme === 'dark' ? 'DARK PROTOCOL' : 'LIGHT PROTOCOL')}
        </span>
      </div>
      {/* Forced LTR direction for the toggle track to prevent RTL flip issues */}
      <div className="w-10 h-6 bg-muted rounded-full relative p-1 transition-colors group-hover:bg-primary/20 flex items-center" dir="ltr">
        <div className={cn(
          "w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
          theme === 'dark' ? "bg-secondary translate-x-4" : "bg-primary translate-x-0"
        )} />
      </div>
    </button>
  );
}