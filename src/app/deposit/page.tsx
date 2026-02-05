
"use client"

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2, Wallet, Camera, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, doc, addDoc } from 'firebase/firestore';

export default function DepositPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [amount, setAmount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const t = {
    header: language === 'ar' ? 'إيداع رصيد' : 'Deposit Assets',
    amountLabel: language === 'ar' ? 'المبلغ المطلوب إيداعه' : 'Amount to Deposit',
    proofLabel: language === 'ar' ? 'صورة إثبات الدفع' : 'Payment Evidence',
    instructions: language === 'ar' ? 'قم بتحويل المبلغ إلى حسابنا البنكي وارفاق صورة الوصل للمراجعة.' : 'Transfer the amount to our bank and attach the receipt for verification.',
    submitBtn: language === 'ar' ? 'إرسال طلب الإيداع' : 'SUBMIT DEPOSIT REQUEST',
    success: language === 'ar' ? 'تم إرسال طلبك بنجاح' : 'Deposit request submitted!',
    error: language === 'ar' ? 'حدث خطأ ما' : 'An error occurred'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !profile || !proofImage) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        username: profile.username,
        amount: parseFloat(amount),
        method: 'Bank Transfer',
        proofUrl: proofImage,
        status: 'pending',
        date: new Date().toISOString()
      });

      toast({ title: t.success });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ variant: "destructive", title: t.error, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      <div className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 gold-glow">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.2em] font-headline uppercase block">{t.amountLabel}</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              className="text-2xl font-headline font-bold h-16 text-center bg-background/50 border-white/10 rounded-xl text-primary focus:border-primary/50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.2em] font-headline uppercase block">{t.proofLabel}</Label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden"
            >
              {proofImage ? (
                <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="text-white/20 group-hover:text-primary transition-colors" size={32} />
                  <span className="text-[8px] font-headline font-bold uppercase text-white/20">Upload Receipt</span>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-3 items-start">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">{t.instructions}</p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !amount || !proofImage}
            className="w-full h-14 text-md font-headline rounded-xl gold-glow bg-primary hover:bg-primary/90 text-background font-black tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" /> : t.submitBtn}
          </Button>
        </form>
      </div>
    </div>
  );
}
