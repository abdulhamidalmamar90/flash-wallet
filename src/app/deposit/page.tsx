
"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Loader2, Wallet, Camera, Check, Info, Landmark, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, doc, addDoc, query, where } from 'firebase/firestore';
import Link from 'next/link';

export default function DepositPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1); 
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const methodsQuery = useMemo(() => {
    if (!db || !profile?.country) return null;
    return query(collection(db, 'deposit_methods'), where('country', '==', profile.country), where('isActive', '==', true));
  }, [db, profile?.country]);
  
  const { data: methods = [], loading: methodsLoading } = useCollection(methodsQuery);

  const t = {
    header: language === 'ar' ? 'إيداع رصيد' : 'Deposit Assets',
    selectMethod: language === 'ar' ? 'اختر وسيلة الإيداع' : 'Select Deposit Gateway',
    noMethods: language === 'ar' ? 'لا تتوفر وسائل إيداع في بلدك حالياً' : 'No gateways available for your region',
    noCountry: language === 'ar' ? 'يرجى تحديد بلدك أولاً من الإعدادات' : 'Please select your country in profile settings first',
    goToSettings: language === 'ar' ? 'اذهب للإعدادات' : 'GO TO SETTINGS',
    amountLabel: language === 'ar' ? 'المبلغ المطلوب إيداعه' : 'Amount to Deposit',
    proofLabel: language === 'ar' ? 'صورة إثبات الدفع' : 'Payment Evidence',
    instructions: language === 'ar' ? 'قم بالتحويل للبيانات المذكورة وارفاق صورة الوصل للمراجعة.' : 'Transfer to the credentials above and attach the receipt for review.',
    submitBtn: language === 'ar' ? 'إرسال طلب الإيداع' : 'SUBMIT DEPOSIT REQUEST',
    success: language === 'ar' ? 'تم إرسال طلبك بنجاح' : 'Deposit request submitted!',
    error: language === 'ar' ? 'حدث خطأ ما' : 'An error occurred',
    details: language === 'ar' ? 'بيانات التحويل' : 'Gateway Credentials'
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
    if (!user || !amount || !profile || !proofImage || !selectedMethod) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        username: profile.username,
        amount: parseFloat(amount),
        method: selectedMethod.name,
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

  if (methodsLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => step === 1 ? router.back() : setStep(1)} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{t.selectMethod}</h2>
            {profile?.country ? (
              <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-primary/20 text-primary">{profile.country}</Badge>
            ) : (
              <Badge variant="destructive" className="text-[8px] uppercase tracking-widest">{language === 'ar' ? 'دولة غير محددة' : 'NO COUNTRY'}</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {!profile?.country ? (
              <div className="glass-card p-10 rounded-3xl text-center space-y-6">
                <Info className="mx-auto text-muted-foreground" size={32} />
                <p className="text-[10px] font-headline font-bold uppercase text-muted-foreground leading-relaxed">{t.noCountry}</p>
                <Link href="/profile/edit">
                  <Button className="h-12 bg-primary text-background rounded-xl font-headline font-bold text-[9px] tracking-widest uppercase">
                    <Settings className="mr-2 h-4 w-4" /> {t.goToSettings}
                  </Button>
                </Link>
              </div>
            ) : methods.length === 0 ? (
              <div className="glass-card p-10 rounded-3xl text-center space-y-4">
                <Info className="mx-auto text-muted-foreground" size={32} />
                <p className="text-[10px] font-headline font-bold uppercase text-muted-foreground">{t.noMethods}</p>
              </div>
            ) : methods.map((m: any) => (
              <button 
                key={m.id} 
                onClick={() => { setSelectedMethod(m); setStep(2); }}
                className="glass-card p-6 rounded-3xl flex items-center justify-between border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Landmark size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-headline font-bold uppercase text-white">{m.name}</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Authorized Gateway</p>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary transition-all">
                  <Check size={14} className="group-hover:text-background" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow animate-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-primary">{selectedMethod.name}</span>
              <span className="text-[8px] text-muted-foreground uppercase">{t.details}</span>
            </div>
            <div className="p-6 bg-background/50 rounded-2xl border border-white/5 text-center space-y-2">
              <p className="text-xl font-headline font-black text-white tracking-widest">{selectedMethod.details}</p>
              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Copy data exactly as shown</p>
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
                className="w-full h-44 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group relative overflow-hidden"
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
      )}
    </div>
  );
}
