
"use client"

import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const store = useStore();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => store.toggleLanguage()}
      className="glass-card rounded-xl w-10 h-10 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">Toggle Language</span>
    </Button>
  );
}
