
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, Gamepad2, Gift, PhoneCall, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';

const SERVICES = [
  { id: 1, name: 'PUBG MOBILE UC', price: 9.99, category: 'Games', icon: Gamepad2, color: 'text-orange-400' },
  { id: 2, name: 'Free Fire Diamonds', price: 4.99, category: 'Games', icon: Gamepad2, color: 'text-blue-400' },
  { id: 3, name: 'Google Play Gift Card', price: 25.00, category: 'Cards', icon: Gift, color: 'text-green-400' },
  { id: 4, name: 'iTunes Card $50', price: 50.00, category: 'Cards', icon: Gift, color: 'text-pink-400' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const handleBuy = async (service: any) => {
    if (!user || !profile) return;
    if (profile.balance < service.price) {
      toast({ variant: "destructive", title: "INSUFFICIENT BALANCE", description: "Add funds to complete this purchase." });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-service.price) });
        
        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'purchase',
          amount: service.price,
          service: service.name,
          status: 'completed',
          date: new Date().toISOString()
        });
      });

      toast({ title: "PURCHASE SUCCESSFUL", description: `Your ${service.name} code is being generated.` });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "PURCHASE FAILED", description: e.message });
    }
  };

  const filtered = SERVICES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 glass-card rounded-xl"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-headline font-bold tracking-widest">Marketplace</h1>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-muted-foreground font-bold tracking-widest uppercase">Balance</p>
          <p className="text-sm font-headline text-primary">${profile?.balance?.toLocaleString() || '0'}</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="SEARCH SERVICES..." className="pl-10 h-12 bg-background/50 border-white/10 rounded-xl font-headline text-[10px]" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <section className="grid grid-cols-2 gap-4 pb-24">
        {filtered.map((service) => (
          <div key={service.id} className="glass-card p-5 rounded-2xl flex flex-col justify-between gap-4 border-white/5 hover:border-primary/20 transition-all group">
            <div className="space-y-3">
              <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5", service.color)}><service.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{service.category}</p>
                <h3 className="text-[10px] font-headline font-bold leading-tight group-hover:text-primary">{service.name}</h3>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-sm font-headline text-primary font-bold">${service.price}</p>
              <button onClick={() => handleBuy(service)} className="w-full py-2 bg-white/5 border border-white/5 rounded-lg text-[9px] font-headline font-bold tracking-widest hover:bg-primary hover:text-background transition-all">BUY NOW</button>
            </div>
          </div>
        ))}
      </section>
      <BottomNav />
    </div>
  );
}
