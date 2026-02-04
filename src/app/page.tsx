"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Shield, Rocket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      <div className="absolute top-0 left-0 w-full h-full circuit-pattern pointer-events-none" />
      
      <div className="z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 gold-glow mb-4">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-headline font-black text-primary">FLASH</h1>
          <p className="text-muted-foreground tracking-widest text-xs uppercase font-medium">Future of Digital Finance</p>
        </div>

        <div className="glass-card p-8 rounded-3xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">IDENTITY</Label>
              <Input 
                id="email" 
                placeholder="Username or Email" 
                className="bg-background/50 border-white/10 focus:border-primary transition-all rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">ACCESS KEY</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-background/50 border-white/10 focus:border-primary transition-all rounded-xl"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-md font-headline rounded-xl gold-glow hover:scale-[1.02] transition-transform active:scale-95"
              disabled={loading}
            >
              {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
            </Button>
          </form>

          <div className="text-center">
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
              Request New Credentials?
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl">
            <Shield className="h-4 w-4 text-secondary" />
            <span className="text-[8px] font-headline text-center">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-[8px] font-headline text-center">Instant</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 glass-card rounded-2xl">
            <Rocket className="h-4 w-4 text-secondary" />
            <span className="text-[8px] font-headline text-center">Global</span>
          </div>
        </div>
      </div>
    </div>
  );
}