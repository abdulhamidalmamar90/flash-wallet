"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasOnboarded = localStorage.getItem('flash_onboarded');
      router.push(hasOnboarded ? '/' : '/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
      <div className="text-center space-y-4">
        <h1 className="font-headline text-6xl font-extrabold text-white tracking-tighter">FLASH</h1>
        <div className="flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse"></div>
          <p className="text-[10px] text-primary font-headline font-bold uppercase tracking-[0.6em]">Authorized Environment</p>
        </div>
      </div>
      <div className="absolute bottom-12 text-[8px] text-muted-foreground font-headline uppercase tracking-widest opacity-40">
        Secure Financial Authority v2.5.0
      </div>
    </div>
  );
}