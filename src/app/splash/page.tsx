
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const logo = PlaceHolderImages.find(img => img.id === 'brand-logo');

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if onboarding is needed
      const hasOnboarded = localStorage.getItem('flash_onboarded');
      if (hasOnboarded) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-20"></div>
      <div className="relative z-10 animate-in fade-in zoom-in duration-1000">
        <div className="w-32 h-32 mb-8 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
          <Image 
            src={logo?.imageUrl || ""} 
            alt="FLASH Logo" 
            width={128} 
            height={128} 
            className="object-contain gold-glow rounded-3xl"
            priority
          />
        </div>
        <div className="text-center">
          <h1 className="font-headline text-5xl font-black text-white tracking-tighter mb-2">FLASH</h1>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.4em]">Initializing Core...</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-12 text-[8px] text-white/20 font-headline uppercase tracking-widest">
        Secure Vault v2.5.0
      </div>
    </div>
  );
}
