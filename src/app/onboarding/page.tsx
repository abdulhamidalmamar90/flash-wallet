"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';

const STEPS = [
  {
    title: "AUTHORITY",
    titleAr: "السلطة المالية",
    desc: "Licensed digital financial infrastructure with multi-layer encryption protocols.",
    descAr: "بنية تحتية مالية رقمية مرخصة مع بروتوكولات تشفير متعددة الطبقات.",
    icon: Shield,
  },
  {
    title: "PRECISION",
    titleAr: "الدقة",
    desc: "Instantaneous global settlements via the proprietary Flash network.",
    descAr: "تسويات عالمية فورية عبر شبكة فلاش الخاصة.",
    icon: Zap,
  },
  {
    title: "ECOSYSTEM",
    titleAr: "النظام الشامل",
    desc: "Unified access to global financial services and digital assets.",
    descAr: "وصول موحد للخدمات المالية العالمية والأصول الرقمية.",
    icon: Globe,
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { language } = useStore();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('flash_onboarded', 'true');
      router.push('/');
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col p-12">
      <header className="flex justify-between items-center">
        <div className="font-headline font-bold text-lg text-white tracking-tighter">FLASH</div>
        <button onClick={() => { localStorage.setItem('flash_onboarded', 'true'); router.push('/'); }} className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors">
          {language === 'ar' ? 'تخطي' : 'Skip'}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center space-y-16 max-w-xs mx-auto">
        <div className="w-24 h-24 bg-card border border-border flex items-center justify-center text-primary">
          <step.icon size={48} strokeWidth={1.5} />
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight leading-none">
            {language === 'ar' ? step.titleAr : step.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {language === 'ar' ? step.descAr : step.desc}
          </p>
        </div>
      </main>

      <footer className="space-y-12 pb-8 max-w-xs mx-auto w-full">
        <div className="flex justify-center gap-3">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-700", i === currentStep ? "w-10 bg-primary" : "w-3 bg-muted")} />
          ))}
        </div>

        <Button 
          onClick={handleNext} 
          className="w-full h-14 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-between px-8"
        >
          <span>{currentStep === STEPS.length - 1 ? (language === 'ar' ? 'البدء' : 'ENTER VAULT') : (language === 'ar' ? 'استمرار' : 'CONTINUE')}</span>
          <ArrowRight size={16} className={cn(language === 'ar' && "rotate-180")} />
        </Button>
      </footer>
    </div>
  );
}