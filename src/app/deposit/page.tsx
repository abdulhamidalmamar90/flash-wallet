"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Loader2, Wallet, Camera, Check, Info, Landmark, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, doc, addDoc, query, where } from 'firebase/firestore';
import { sendTelegramNotification } from '@/lib/telegram';
import Link from 'next/link';

const COUNTRIES = [
  // Arab Countries
  { code: 'SA', name: 'Saudi Arabia', ar: 'السعودية' },
  { code: 'EG', name: 'Egypt', ar: 'مصر' },
  { code: 'AE', name: 'UAE', ar: 'الإمارات' },
  { code: 'KW', name: 'Kuwait', ar: 'الكويت' },
  { code: 'QA', name: 'Qatar', ar: 'قطر' },
  { code: 'JO', name: 'Jordan', ar: 'الأردن' },
  { code: 'IQ', name: 'Iraq', ar: 'العراق' },
  { code: 'LY', name: 'Libya', ar: 'ليبيا' },
  { code: 'DZ', name: 'Algeria', ar: 'الجزائر' },
  { code: 'MA', name: 'Morocco', ar: 'المغرب' },
  { code: 'PS', name: 'Palestine', ar: 'فلسطين' },
  { code: 'LB', name: 'Lebanon', ar: 'لبنان' },
  { code: 'SY', name: 'Syria', ar: 'سوريا' },
  { code: 'OM', name: 'Oman', ar: 'عمان' },
  { code: 'YE', name: 'Yemen', ar: 'اليمن' },
  { code: 'BH', name: 'Bahrain', ar: 'البحرين' },
  { code: 'TN', name: 'Tunisia', ar: 'تونس' },
  { code: 'SD', name: 'Sudan', ar: 'السودان' },
  // Global Countries
  { code: 'US', name: 'USA', ar: 'أمريكا' },
  { code: 'GB', name: 'UK', ar: 'بريطانيا' },
  { code: 'CA', name: 'Canada', ar: 'كندا' },
  { code: 'DE', name: 'Germany', ar: 'ألمانيا' },
  { code: 'FR', name: 'France', ar: 'فرنسا' },
  { code: 'IT', name: 'Italy', ar: 'إيطاليا' },
  { code: 'ES', name: 'Spain', ar: 'إسبانيا' },
  { code: 'TR', name: 'Turkey', ar: 'تركيا' },
  { code: 'CN', name: 'China', ar: 'الصين' },
  { code: 'JP', name: 'Japan', ar: 'اليابان' },
  { code: 'KR', name: 'South Korea', ar: 'كوريا الجنوبية' },
  { code: 'IN', name: 'India', ar: 'الهند' },
  { code: 'RU', name: 'Russia', ar: 'روسيا' },
  { code: 'BR', name: 'Brazil', ar: 'البرازيل' },
  { code: 'AU', name: 'Australia', ar: 'أستراليا' },
];

export default function DepositPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1); 
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  useEffect(() => {
    if (profile?.country && !selectedCountry) {
      setSelectedCountry(profile.country);
    }
  }, [profile?.country, selectedCountry]);

  const methodsQuery = useMemo(() => {
    if (!db || !selectedCountry) return null;
    return query(collection(db, 'deposit_methods'), where('country', '==', selectedCountry), where('isActive', '==', true));
  }, [db, selectedCountry]);
  
  const { data: methods = [], loading: methodsLoading } = useCollection(methodsQuery);

  const t = {
    header: language === 'ar' ? 'إيداع رصيد' : 'Deposit Assets',
    selectCountry: language === 'ar' ? 'اختر الدولة' : 'Select Country',
    selectMethod: language === 'ar' ? 'اختر وسيلة الإيداع' : 'Select Deposit Gateway',
    noMethods: language === 'ar' ? 'لا تتوفر وسائل إيداع في هذا البلد حالياً' : 'No gateways available for this region',
    amountLabel: language === 'ar' ? 'المبلغ المطلوب إيداعه' : 'Amount to Deposit',
    proofLabel: language === 'ar' ? 'صورة إثبات الدفع' : 'Payment Evidence',
    senderLabel: language === 'ar' ? 'اسم المرسل' : 'Sender Name',
    instructions: language === 'ar' ? 'قم بالتحويل للبيانات المذكورة وارفاق صورة الوصل للمراجعة.' : 'Transfer to the credentials above and attach the receipt for review.',
    submitBtn: language === 'ar' ? 'إرسال طلب الإيداع' : 'SUBMIT DEPOSIT REQUEST',
    nextBtn: language === 'ar' ? 'استمرار' : 'CONTINUE',
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
        senderName: senderName || profile.username,
        amount: parseFloat(amount),
        method: selectedMethod.name,
        proofUrl: proofImage,
        status: 'pending',
        date: new Date().toISOString()
      });

      // Telegram Notification
      await sendTelegramNotification(`
💰 <b>New Deposit Request</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>ID:</b> <code>${profile.customId}</code>
<b>Amount:</b> $${amount}
<b>Method:</b> ${selectedMethod.name}
<b>Sender:</b> ${senderName || profile.username}
<b>Country:</b> ${selectedCountry}
<b>Date:</b> ${new Date().toLocaleString()}
      `);

      toast({ title: t.success });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ variant: "destructive", title: t.error, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.selectCountry}</Label>
              <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setStep(2); }}>
                <SelectTrigger className="h-14 bg-card/40 border-white/10 rounded-2xl text-[10px] uppercase tracking-widest font-headline">
                  <SelectValue placeholder="CHOOSE COUNTRY" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code} className="text-[10px] uppercase font-headline">
                      {language === 'ar' ? c.ar : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCountry && (
               <Button onClick={() => setStep(2)} className="w-full h-14 font-headline text-md rounded-xl bg-primary text-background font-black tracking-widest">
                  {t.nextBtn}
               </Button>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{t.selectMethod}</h2>
              <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-primary/20 text-primary">{selectedCountry}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {methodsLoading ? (
                <Loader2 className="animate-spin mx-auto text-primary" />
              ) : methods.length === 0 ? (
                <div className="glass-card p-10 rounded-3xl text-center space-y-4">
                  <Info className="mx-auto text-muted-foreground" size={32} />
                  <p className="text-[10px] font-headline font-bold uppercase text-muted-foreground">{t.noMethods}</p>
                  <Button variant="ghost" className="text-[8px] uppercase font-headline" onClick={() => setStep(1)}>Change Country</Button>
                </div>
              ) : methods.map((m: any) => (
                <button 
                  key={m.id} 
                  onClick={() => { setSelectedMethod(m); setStep(3); }}
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
        );
      case 3:
        return (
          <div className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-primary">{selectedMethod.name}</span>
                <span className="text-[8px] text-muted-foreground uppercase">{t.details}</span>
              </div>
              <div className="p-6 bg-background/50 rounded-2xl border border-white/5 text-center space-y-2">
                <p className="text-xl font-headline font-black text-white tracking-widest break-all">{selectedMethod.details}</p>
                <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Copy data exactly as shown</p>
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] tracking-[0.2em] font-headline uppercase block">{t.amountLabel}</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="text-2xl font-headline font-bold h-16 text-center bg-background/50 border-white/10 rounded-xl text-primary focus:border-primary/50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button 
                onClick={() => setStep(4)} 
                disabled={!amount}
                className="w-full h-14 text-md font-headline rounded-xl gold-glow bg-primary hover:bg-primary/90 text-background font-black tracking-widest"
              >
                {t.nextBtn}
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <Label className="text-[10px] tracking-[0.2em] font-headline uppercase block">{t.senderLabel}</Label>
              <div className="relative group">
                <UserIcon className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors", language === 'ar' ? "right-3" : "left-3")} />
                <Input 
                  placeholder="NAME ON ACCOUNT" 
                  className={cn("h-12 bg-background/50 border-white/10 rounded-xl text-[10px] font-headline uppercase", language === 'ar' ? "pr-10" : "pl-10")}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
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
              disabled={loading || !proofImage || !senderName}
              className="w-full h-14 text-md font-headline rounded-xl gold-glow bg-primary hover:bg-primary/90 text-background font-black tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : t.submitBtn}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => step === 1 ? router.back() : setStep(step - 1)} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      {renderStep()}
    </div>
  );
}
