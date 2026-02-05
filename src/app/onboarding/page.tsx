
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Zap, Globe, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStore } from '@/app/lib/store';

const STEPS = [
  {
    title: "FUTURE OF BANKING",
    titleAr: "مستقبل الصيرفة",
    desc: "Experience high-end financial security with our next-gen digital vault.",
    descAr: "اختبر الأمان المالي المطلق مع خزنتنا الرقمية من الجيل القادم.",
    icon: ShieldCheck,
    color: "text-primary"
  },
  {
    title: "INSTANT TRANSFERS",
    titleAr: "تحويلات لحظية",
    desc: "Send money globally in milliseconds using Flash identity technology.",
    descAr: "أرسل الأموال عالمياً في أجزاء من الثانية باستخدام تقنية فلاش.",
    icon: Zap,
    color: "text-secondary"
  },
  {
    title: "GLOBAL MARKET",
    titleAr: "سوق عالمي",
    desc: "Access digital services and gift cards directly from your wallet.",
    descAr: "اصعد إلى عالم الخدمات الرقمية وبطاقات الهدايا مباشرة من محفظتك.",
    icon: Globe,
    color: "text-primary"
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

  const skip = () => {
    localStorage.setItem('flash_onboarded', 'true');
    router.push('/');
  };

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col p-8 relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-10"></div>
      
      <header className="flex justify-between items-center z-10">
        <div className="font-headline font-black text-xl text-white">FLASH</div>
        <button onClick={skip} className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-primary transition-colors">
          {language === 'ar' ? 'تخطي' : 'Skip'}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 text-center space-y-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className={cn("w-32 h-32 rounded-[2rem] bg-card/50 border border-white/5 flex items-center justify-center transition-all duration-700", step.color)}>
            <step.icon size={56} className="animate-in zoom-in duration-500" />
          </div>
        </div>

        <div className="space-y-4 max-w-xs">
          <h2 className="text-3xl font-headline font-black text-white tracking-tight animate-in slide-in-from-bottom-4 duration-500">
            {language === 'ar' ? step.titleAr : step.title}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed font-body">
            {language === 'ar' ? step.descAr : step.desc}
          </p>
        </div>
      </main>

      <footer className="z-10 space-y-8 pb-12">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 rounded-full transition-all duration-500", 
                i === currentStep ? "w-8 bg-primary" : "w-2 bg-white/10"
              )} 
            />
          ))}
        </div>

        <Button 
          onClick={handleNext} 
          className="w-full h-16 rounded-2xl bg-primary text-background font-headline font-black text-md tracking-widest flex items-center justify-between px-8 group overflow-hidden"
        >
          <span>{currentStep === STEPS.length - 1 ? (language === 'ar' ? 'ابدأ الآن' : 'GET STARTED') : (language === 'ar' ? 'التالي' : 'CONTINUE')}</span>
          <ArrowRight className={cn("transition-transform group-hover:translate-x-2", language === 'ar' && "rotate-180 group-hover:-translate-x-2")} />
        </Button>
      </footer>
    </div>
  );
}
