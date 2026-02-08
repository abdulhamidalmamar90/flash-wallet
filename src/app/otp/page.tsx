
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useStore } from '@/app/lib/store';

export default function OTPPage() {
  const router = useRouter();
  const { language } = useStore();
  const { toast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<HTMLInputElement[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-12">
      <header>
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-white transition-all">
          <ArrowLeft size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center space-y-16 max-w-sm mx-auto w-full">
        <div className="w-20 h-20 bg-card border border-border flex items-center justify-center text-primary">
          <Shield size={40} strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight uppercase">SECURE VERIFICATION</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">Input the 6-digit cryptographic sequence</p>
        </div>

        <div className="flex gap-3" dir="ltr">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { if(el) inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-16 bg-card border border-border text-center text-xl font-headline font-bold text-primary focus:border-primary transition-all outline-none"
            />
          ))}
        </div>

        <Button 
          onClick={handleVerify} 
          disabled={loading || otp.join('').length < 6}
          className="w-full h-14 bg-primary text-primary-foreground font-headline font-bold text-xs tracking-[0.2em] rounded-none"
        >
          {loading ? <Loader2 className="animate-spin" /> : "VALIDATE ACCESS"}
        </Button>
      </main>
    </div>
  );
}
