
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Rocket, Zap } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const logoImage = PlaceHolderImages.find(img => img.id === 'brand-logo');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Grid Pattern - isolated within component */}
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-40" />
      
      <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          {/* Logo Section with brand image */}
          <div className="relative w-40 h-32 mx-auto mb-2 group">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Image 
              src={logoImage?.imageUrl || "https://picsum.photos/seed/flash-logo/400/300"}
              alt={logoImage?.description || "FLASH Logo"}
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(230,201,140,0.3)] animate-pulse-slow"
              data-ai-hint={logoImage?.imageHint || "futuristic logo"}
            />
          </div>
          <h1 className="text-4xl font-headline font-black text-primary tracking-tighter">FLASH</h1>
          <p className="text-muted-foreground tracking-[0.4em] text-[10px] uppercase font-bold opacity-70">
            Future of Digital Finance
          </p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] space-y-6 border-white/5 cyan-glow-border">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] tracking-widest font-headline font-bold">IDENTITY</Label>
              <Input 
                id="email" 
                placeholder="Username or Email" 
                className="bg-background/50 border-white/10 focus:border-primary transition-all rounded-xl h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Access Key" className="text-[10px] tracking-widest font-headline font-bold">ACCESS KEY</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-background/50 border-white/10 focus:border-primary transition-all rounded-xl h-12"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-sm font-headline font-bold tracking-widest rounded-xl bg-primary text-background hover:scale-[1.02] transition-all active:scale-95 shadow-[0_0_20px_rgba(230,201,140,0.2)]"
              disabled={loading}
            >
              {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
            </Button>
          </form>

          <div className="text-center">
            <button className="text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase font-bold tracking-widest">
              Request New Credentials?
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl border-white/5">
            <Shield className="h-4 w-4 text-secondary neon-cyan" />
            <span className="text-[7px] font-headline font-black tracking-widest uppercase">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl border-white/5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-[7px] font-headline font-black tracking-widest uppercase">Instant</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 glass-card rounded-2xl border-white/5">
            <Rocket className="h-4 w-4 text-secondary neon-cyan" />
            <span className="text-[7px] font-headline font-black tracking-widest uppercase">Global</span>
          </div>
        </div>
      </div>
    </div>
  );
}
