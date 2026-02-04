
"use client"

import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useStore();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => toggleTheme()}
      className="glass-card rounded-xl w-10 h-10 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle Theme</span>
    </Button>
  );
}
