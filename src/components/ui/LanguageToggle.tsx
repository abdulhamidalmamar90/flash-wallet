"use client"

import { useStore } from '@/app/lib/store';

export function LanguageToggle() {
  const { language, toggleLanguage } = useStore();
  
  return (
    <div className="fx-block">
      <div className="toggle">
        <div>
          <input 
            type="checkbox" 
            id="toggles" 
            checked={language === 'en'} 
            onChange={toggleLanguage} 
          />
          <div data-unchecked="ع" data-checked="E">
          </div>
        </div>
      </div>
    </div>
  );
}
