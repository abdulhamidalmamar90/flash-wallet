"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send, User, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TransferPage() {
  const router = useRouter();
  const store = useStore();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    
    setLoading(true);
    setTimeout(() => {
      const success = store.sendMoney(recipient, parseFloat(amount));
      setLoading(false);
      
      if (success) {
        toast({
          title: "TRANSFER SUCCESSFUL",
          description: `You sent $${amount} to @${recipient}`,
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "TRANSACTION FAILED",
          description: "Insufficient balance in your Flash vault.",
        });
      }
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest">Internal Transfer</h1>
      </header>

      <div className="glass-card p-8 rounded-3xl space-y-8 border-white/5 cyan-glow">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30 cyan-glow">
            <Send className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-xs tracking-[0.2em] font-headline uppercase">Recipient Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="recipient" 
                placeholder="Ex: CryptoWhale" 
                className="pl-10 h-12 bg-background/50 border-white/10 rounded-xl"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs tracking-[0.2em] font-headline uppercase">Amount (USD)</Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="0.00" 
              className="text-2xl font-headline font-bold h-16 text-center bg-background/50 border-white/10 rounded-xl text-primary"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-md font-headline rounded-xl cyan-glow bg-secondary hover:bg-secondary/90 text-background"
              disabled={loading}
            >
              {loading ? "INITIALIZING P2P..." : "AUTHORIZE TRANSFER"}
            </Button>
          </div>
        </form>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Available balance</p>
          <p className="text-xl font-headline font-black text-primary">${store.balance?.toLocaleString()}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}