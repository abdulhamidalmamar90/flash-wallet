
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useStore } from '@/app/lib/store';
import { cn } from '@/lib/utils';

export default function OTPPage() {
  const router = useRouter();
  const { language } = useStore();
  const { toast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    
    setLoading(true);
    // Simulated verification
    setTimeout(() => {
      setLoading(false);
      toast({ title: language === 'ar' ? "تم التحقق بنجاح" : "Identity Verified" });
      router.push('/dashboard');
    }, 2000);
  };

  const t = {
    header: language === 'ar' ? 'التحقق الثنائي' : 'Secure Verification',
    desc: language === 'ar' ? 'أدخل رمز التحقق المرسل لهاتفك' : 'Enter the 6-digit code sent to your device',
    resend: language === 'ar' ? 'إعادة الإرسال' : 'Resend Code',
    verify: language === 'ar' ? 'تأكيد الهوية' : 'Verify Identity'
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col p-8 relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-10"></div>
      
      <header className="z-10">
        <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:text-primary transition-all">
          <ArrowLeft size={20} className={cn(language === 'ar' && "rotate-180")} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center z-10 space-y-12">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center gold-glow">
          <ShieldCheck size={32} className="text-primary" />
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-2xl font-headline font-black text-white uppercase tracking-tight">{t.header}</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{t.desc}</p>
        </div>

        <div className="flex gap-2 sm:gap-4" dir="ltr">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { if(el) inputs.current[i] = el; }}
              type="number"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-10 h-14 sm:w-12 sm:h-16 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-headline font-black text-primary focus:border-primary/50 focus:outline-none transition-all"
            />
          ))}
        </div>

        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              {language === 'ar' ? 'إعادة الإرسال خلال' : 'Resend in'} {timeLeft}s
            </p>
          ) : (
            <button onClick={() => setTimeLeft(60)} className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">
              {t.resend}
            </button>
          )}
        </div>
      </main>

      <footer className="z-10 pb-12">
        <Button 
          onClick={handleVerify} 
          disabled={loading || otp.join('').length < 6}
          className="w-full h-16 rounded-2xl bg-primary text-background font-headline font-black tracking-widest text-md"
        >
          {loading ? <Loader2 className="animate-spin" /> : t.verify}
        </Button>
      </footer>
    </div>
  );
}
