
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ChevronLeft, 
  Gamepad2, 
  Gift, 
  Users, 
  ShoppingBag, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Keyboard,
  Coins,
  ArrowRight,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, increment, runTransaction, addDoc, query, where } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const CATEGORY_ICONS: Record<string, any> = {
  Games: Gamepad2,
  Cards: Gift,
  Software: ShoppingBag,
  Social: Users,
};

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  
  // Checkout Modal State
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [isBuying, setIsSending] = useState(false);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const servicesQuery = useMemo(() => query(collection(db, 'marketplace_services'), where('isActive', '==', true)), [db]);
  const { data: services = [], loading: servicesLoading } = useCollection(servicesQuery);

  const filtered = services.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()));

  const handleOpenBuyModal = (service: any) => {
    setSelectedService(service);
    setSelectedVariantIdx("");
    setUserInput("");
  };

  const handleConfirmPurchase = async () => {
    if (!user || !profile || !selectedService) return;

    let finalPrice = selectedService.price;
    let variantLabel = "";

    if (selectedService.type === 'variable') {
      if (selectedVariantIdx === "") {
        toast({ variant: "destructive", title: "SELECT OPTION", description: "Please select a package first." });
        return;
      }
      const variant = selectedService.variants[parseInt(selectedVariantIdx)];
      finalPrice = variant.price;
      variantLabel = variant.label;
    }

    if (selectedService.requiresInput && !userInput.trim()) {
      toast({ variant: "destructive", title: "DATA REQUIRED", description: `Please provide the ${selectedService.inputLabel}.` });
      return;
    }

    if (profile.balance < finalPrice) {
      toast({ variant: "destructive", title: "INSUFFICIENT BALANCE", description: "Add funds to complete this purchase." });
      return;
    }

    setIsSending(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-finalPrice) });
        
        // Add to user transactions
        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'purchase',
          amount: finalPrice,
          service: selectedService.name + (variantLabel ? ` (${variantLabel})` : ''),
          status: 'completed',
          date: new Date().toISOString()
        });

        // Add to global service requests for admin
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
      });

      toast({ title: "PURCHASE SUCCESSFUL", description: `Your order has been logged for processing.` });
      setSelectedService(null);
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: "PURCHASE FAILED", description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 glass-card rounded-xl"><ChevronLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-headline font-bold tracking-widest uppercase">Global Store</h1>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-muted-foreground font-black tracking-widest uppercase">Vault Asset</p>
          <p className="text-sm font-headline font-black text-primary">${profile?.balance?.toLocaleString() || '0'}</p>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input placeholder="SEARCH PROTOCOLS..." className="pl-12 h-14 bg-background/50 border-white/10 rounded-2xl font-headline text-[10px] tracking-widest uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <section className="grid grid-cols-2 gap-4">
        {servicesLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 glass-card rounded-3xl border-dashed border-white/10">
            <AlertCircle className="mx-auto text-muted-foreground mb-3" />
            <p className="text-[10px] font-headline font-bold text-muted-foreground uppercase tracking-widest">No assets found</p>
          </div>
        ) : filtered.map((service: any) => {
          const Icon = CATEGORY_ICONS[service.category] || ShoppingBag;
          const displayPrice = service.type === 'variable' 
            ? `From $${Math.min(...service.variants.map((v: any) => v.price))}`
            : `$${service.price}`;

          return (
            <div key={service.id} className="glass-card rounded-[2rem] flex flex-col border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
              <div className="aspect-[4/3] relative bg-white/5">
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Icon className={cn("h-10 w-10 opacity-20", service.color)} /></div>
                )}
                <div className="absolute top-3 left-3"><Badge className={cn("text-[7px] uppercase font-black tracking-tighter border-white/10", service.color)}>{service.category}</Badge></div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-[11px] font-headline font-bold leading-tight group-hover:text-primary transition-colors uppercase">{service.name}</h3>
                  <p className="text-lg font-headline font-black text-primary mt-2">{displayPrice}</p>
                </div>
                <button onClick={() => handleOpenBuyModal(service)} className="w-full h-10 bg-primary/10 border border-primary/20 rounded-xl text-[9px] font-headline font-bold tracking-widest uppercase hover:bg-primary hover:text-background transition-all">Order Asset</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Buying Modal */}
      <Dialog open={!!selectedService} onOpenChange={() => !isBuying && setSelectedService(null)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000]">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
                  <ShoppingBag size={14} className="text-primary" /> Purchase Protocol
                </DialogTitle>
              </DialogHeader>
              
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/20 shrink-0">
                    {selectedService.imageUrl ? <img src={selectedService.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={20} className="text-primary/20" /></div>}
                  </div>
                  <div>
                    <p className="text-[10px] font-headline font-bold uppercase">{selectedService.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{selectedService.category}</p>
                  </div>
                </div>

                {selectedService.type === 'variable' && (
                  <div className="space-y-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">Select Package</Label>
                    <Select value={selectedVariantIdx} onValueChange={setSelectedVariantIdx}>
                      <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl text-[10px] uppercase font-headline">
                        <SelectValue placeholder="CHOOSE QUANTITY" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        {selectedService.variants.map((v: any, idx: number) => (
                          <SelectItem key={idx} value={idx.toString()} className="text-[10px] uppercase font-headline">
                            {v.label} - ${v.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedService.requiresInput && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-[8px] uppercase tracking-widest text-muted-foreground">{selectedService.inputLabel || "Required Info"}</Label>
                    <div className="relative">
                      <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                      <Input 
                        placeholder={`ENTER ${selectedService.inputLabel?.toUpperCase() || "DATA"}`} 
                        className="h-14 bg-background/50 border-white/10 rounded-xl text-[10px] font-headline uppercase pl-12" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20 flex justify-between items-center">
                  <p className="text-[10px] font-headline font-bold uppercase text-primary">Final Asset Cost</p>
                  <p className="text-2xl font-headline font-black text-primary">
                    ${selectedService.type === 'variable' 
                      ? (selectedVariantIdx !== "" ? selectedService.variants[parseInt(selectedVariantIdx)].price : "---")
                      : selectedService.price}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedService(null)} className="flex-1 h-14 rounded-xl font-headline text-[9px] uppercase tracking-widest border-white/10" disabled={isBuying}>Abort</Button>
                  <Button onClick={handleConfirmPurchase} disabled={isBuying} className="flex-1 h-14 bg-primary text-background rounded-xl font-headline text-[9px] uppercase tracking-widest font-black gold-glow">
                    {isBuying ? <Loader2 className="animate-spin" /> : "Authorize"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
