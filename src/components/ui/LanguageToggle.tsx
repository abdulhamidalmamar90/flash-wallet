"use client"

import { useStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, toggleLanguage } = useStore();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="text-[10px] font-headline font-bold tracking-widest uppercase text-primary hover:bg-primary/10"
    >
      <Languages className="h-4 w-4 mr-2" />
      {language === 'ar' ? 'English' : 'العربية'}
    </Button>
  );
}
