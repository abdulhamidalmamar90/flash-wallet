"use client"

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronLeft, 
  Gamepad2, 
  Gift, 
  Users, 
  ShoppingBag, 
  Loader2, 
  Keyboard,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, increment, runTransaction, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const CATEGORY_ICONS: Record<string, any> = {
  GAMES: Gamepad2,
  CARDS: Gift,
  SOFTWARE: ShoppingBag,
  SOCIAL: Users,
};

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [pinEntry, setPinEntry] = useState('');

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const servicesQuery = useMemo(() => db ? query(collection(db, 'marketplace_services'), where('isActive', '==', true)) : null, [db]);
  const { data: services = [], loading: servicesLoading } = useCollection(servicesQuery);

  const categories = useMemo(() => {
    const cats = new Set(services.map((s: any) => s.category?.toUpperCase() || 'UNCATEGORIZED'));
    return Array.from(cats).sort();
  }, [services]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return services.filter((s: any) => {
      const matchesSearch = s.name?.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === 'ALL' || (s.category?.toUpperCase() || 'UNCATEGORIZED') === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, selectedCategory]);

  const handleOpenBuyModal = useCallback((service: any) => {
    setSelectedService(service);
    setSelectedVariantIdx("");
    setUserInput("");
    setIsConfirming(false);
  }, []);

  const handleConfirmPurchase = async () => {
    if (pinEntry !== profile?.pin) {
      toast({ variant: "destructive", title: "INCORRECT PIN" });
      setPinEntry('');
      return;
    }

    if (!user || !profile || !selectedService || !db) return;

    let finalPrice = selectedService.price;
    let variantLabel = "";

    if (selectedService.type === 'variable') {
      const variant = selectedService.variants[parseInt(selectedVariantIdx)];
      if (!variant) {
        toast({ variant: "destructive", title: "SELECT PACKAGE" });
        return;
      }
      finalPrice = variant.price;
      variantLabel = variant.label;
    }

    if (profile.balance < finalPrice) {
      toast({ variant: "destructive", title: "INSUFFICIENT FUNDS" });
      return;
    }

    setIsBuying(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-finalPrice) });
        
        const requestRef = doc(collection(db, 'service_requests'));
        transaction.set(requestRef, {
          userId: user.uid,
          username: profile.username,
          serviceName: selectedService.name,
          selectedVariant: variantLabel,
          userInput: userInput.trim(),
          price: finalPrice,
          status: 'pending',
          date: new Date().toISOString()
        });

        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'purchase',
          amount: finalPrice,
          service: selectedService.name,
          status: 'pending',
          date: new Date().toISOString()
        });
      });

      toast({ title: "PURCHASE SUCCESSFUL" });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "PURCHASE FAILED" });
    } finally {
      setIsBuying(false);
      setIsPinVerificationOpen(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-headline font-bold tracking-widest uppercase">Global Store</h1>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-muted-foreground uppercase font-black">Vault</p>
          <p className="text-sm font-headline font-black text-primary">${profile?.balance?.toLocaleString() || '0'}</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="SEARCH PROTOCOLS..." className="pl-12 h-14 bg-background/50 border-white/10 rounded-2xl font-headline text-[10px] uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setSelectedCategory('ALL')} className={cn("px-4 py-2 rounded-full border text-[8px] font-headline font-bold uppercase transition-all shrink-0", selectedCategory === 'ALL' ? "bg-primary text-background border-primary" : "bg-white/5 text-muted-foreground border-white/10")}>All Assets</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-4 py-2 rounded-full border text-[8px] font-headline font-bold uppercase transition-all shrink-0", selectedCategory === cat ? "bg-primary text-background border-primary" : "bg-white/5 text-muted-foreground border-white/10")}>{cat}</button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4">
        {servicesLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-20"><ShoppingBag className="mx-auto mb-4" size={48} /><p className="text-[10px] font-headline font-bold uppercase">No protocols found</p></div>
        ) : filtered.map((service: any) => {
          const catKey = (service.category || '').toUpperCase();
          const Icon = CATEGORY_ICONS[catKey] || ShoppingBag;
          return (
            <div key={service.id} className="glass-card rounded-[2rem] flex flex-col border-white/5 group overflow-hidden hover:border-primary/20 transition-all">
              <div className="aspect-[4/3] relative bg-white/5">
                {service.imageUrl ? <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center"><Icon className="h-10 w-10 opacity-20" /></div>}
                <div className="absolute top-3 left-3"><Badge className="text-[6px] uppercase bg-black/60 border-white/10">{service.category}</Badge></div>
              </div>
              <div className="p-5 space-y-4">
                <h3 className="text-[11px] font-headline font-bold leading-tight uppercase truncate">{service.name}</h3>
                <button onClick={() => handleOpenBuyModal(service)} className="w-full h-10 bg-primary/10 border border-primary/20 rounded-xl text-[9px] font-headline font-bold uppercase hover:bg-primary hover:text-background transition-all">Order</button>
              </div>
            </div>
          );
        })}
      </section>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              {isConfirming ? <ShieldCheck className="text-primary" size={14} /> : <ShoppingBag className="text-primary" size={14} />}
              {isConfirming ? "Authorization" : "Purchase"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            {!isConfirming ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">{selectedService?.imageUrl ? <img src={selectedService.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag /></div>}</div>
                    <div><p className="text-[10px] font-headline font-bold uppercase">{selectedService?.name}</p><p className="text-[8px] text-muted-foreground uppercase">{selectedService?.category}</p></div>
                  </div>

                  {selectedService?.type === 'variable' && (
                    <div className="space-y-2">
                      <Label className="text-[8px] uppercase font-black text-muted-foreground px-1">Select Package</Label>
                      <Select value={selectedVariantIdx} onValueChange={setSelectedVariantIdx}>
                        <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase font-headline">
                          <SelectValue placeholder="CHOOSE PACKAGE" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4} className="bg-card border-white/10 z-[1100] mt-1 shadow-2xl">
                          {selectedService.variants.map((v: any, idx: number) => (
                            <SelectItem 
                              key={idx} 
                              value={idx.toString()} 
                              className="text-[10px] uppercase font-headline focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer"
                            >
                              {v.label} - ${v.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedService?.requiresInput && (
                    <div className="space-y-2">
                      <Label className="text-[8px] uppercase font-black text-muted-foreground px-1">{selectedService.inputLabel}</Label>
                      <Input 
                        placeholder={`ENTER ${selectedService.inputLabel}`} 
                        className="h-14 bg-background/50 border-white/10 rounded-xl text-[10px] font-headline uppercase" 
                        value={userInput} 
                        onChange={(e) => setUserInput(e.target.value)} 
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setIsConfirming(true)} 
                  disabled={selectedService?.type === 'variable' && !selectedVariantIdx}
                  className="w-full h-14 bg-primary text-background font-headline font-black text-[10px] tracking-widest rounded-xl gold-glow"
                >
                  PROCEED TO CHECKOUT
                </Button>
              </>
            ) : (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95">
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-4">
                  <ShieldCheck className="mx-auto text-primary" size={48} />
                  <div className="space-y-1">
                    <p className="text-[10px] font-headline font-bold uppercase tracking-widest">Final Authorization</p>
                    <p className="text-[8px] text-muted-foreground uppercase">Confirm deduction from vault balance</p>
                  </div>
                  <div className="text-2xl font-headline font-black text-primary">
                    ${selectedService?.type === 'fixed' ? selectedService.price : selectedService?.variants[parseInt(selectedVariantIdx)]?.price}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => { setIsConfirming(false); setIsPinVerificationOpen(true); }} className="w-full h-14 bg-primary text-background font-black rounded-xl gold-glow text-[10px] tracking-widest uppercase">AUTHORIZE TRANSACTION</Button>
                  <Button variant="ghost" onClick={() => setIsConfirming(false)} className="text-[8px] font-headline uppercase text-muted-foreground">Modify Protocol</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> Verify Vault PIN</DialogTitle></DialogHeader>
          <div className="mt-8 space-y-6">
            <Input type="password" maxLength={4} value={pinEntry} onChange={(e) => setPinEntry(e.target.value)} className="h-16 text-3xl text-center font-headline bg-background/50 border-white/10" />
            <Button onClick={handleConfirmPurchase} disabled={isBuying || pinEntry.length < 4} className="w-full h-14 bg-primary text-background font-black rounded-xl gold-glow text-[10px] tracking-widest uppercase">
              {isBuying ? <Loader2 className="animate-spin" /> : "VALIDATE ACCESS"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}