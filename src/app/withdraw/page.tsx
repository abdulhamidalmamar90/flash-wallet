"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, 
  Loader2, 
  Landmark, 
  Check, 
  Info, 
  Coins, 
  Wallet,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Fingerprint,
  Delete
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, doc, addDoc, query, where, increment, runTransaction } from 'firebase/firestore';
import { sendTelegramNotification } from '@/lib/telegram';
import { useStore } from '@/app/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COUNTRIES = [
  { code: 'GL', name: 'Global / Worldwide', ar: 'عالمي / دولي' },
  { code: 'CR', name: 'Crypto / Digital Assets', ar: 'عملات رقمية' },
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
  { code: 'US', name: 'USA', ar: 'أمريكا' },
  { code: 'GB', name: 'UK', ar: 'بريطانيا' },
  { code: 'CA', name: 'Canada', ar: 'كندا' },
];

export default function WithdrawPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [step, setStep] = useState(1); 
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
  const [pinEntry, setPinEntry] = useState('');

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  const allMethodsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'withdrawal_methods'), where('isActive', '==', true));
  }, [db]);
  const { data: allWithdrawMethods = [], loading: initialLoading } = useCollection(allMethodsQuery);

  const availableCountries = useMemo(() => {
    const codes = new Set(allWithdrawMethods.map((m: any) => m.country));
    codes.add('CR'); 
    return COUNTRIES.filter(c => codes.has(c.code));
  }, [allWithdrawMethods]);

  useEffect(() => {
    if (profile?.country && !selectedCountry && availableCountries.some(c => c.code === profile.country)) {
      setSelectedCountry(profile.country);
    }
  }, [profile?.country, selectedCountry, availableCountries]);

  const methodsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'withdrawal_methods'), where('isActive', '==', true));
  }, [db]);
  
  const { data: allMethodsList = [], loading: methodsLoading } = useCollection(methodsQuery);

  const filteredMethods = useMemo(() => {
    if (selectedCountry === 'GL') {
      return allMethodsList.filter((m: any) => m.country === 'GL');
    }
    return allMethodsList.filter((m: any) => m.country === selectedCountry);
  }, [allMethodsList, selectedCountry]);

  useEffect(() => {
    if (selectedCountry === 'CR' && step === 2) {
      setSelectedMethod({
        name: 'USDT',
        country: 'CR',
        currencyCode: 'USD',
        exchangeRate: 1,
        feeType: 'fixed',
        feeValue: 2.0,
        fields: [
          { 
            label: language === 'ar' ? 'نوع الشبكة' : 'Network Type', 
            type: 'select', 
            options: 'Tron (TRC20), BNB Smart Chain (BEP20)' 
          },
          { label: language === 'ar' ? 'عنوان الشبكة' : 'Network Address', type: 'text' }
        ]
      });
      setStep(3);
    }
  }, [selectedCountry, step, language]);

  const calculations = useMemo(() => {
    if (!selectedMethod || !amount) return { localAmount: 0, fee: 0, net: 0 };
    const usd = parseFloat(amount || '0');
    const local = usd * (selectedMethod.exchangeRate || 1);
    let fee = 0;
    if (selectedMethod.feeType === 'fixed') {
      fee = selectedMethod.feeValue || 0;
    } else {
      fee = (local * (selectedMethod.feeValue || 0)) / 100;
    }
    return { 
      localAmount: local, 
      fee: fee, 
      net: Math.round(Math.max(0, local - fee)) 
    };
  }, [selectedMethod, amount]);

  const t = {
    header: language === 'ar' ? 'سحب رصيد' : 'Withdraw Funds',
    selectCountry: language === 'ar' ? 'اختر الدولة' : 'Select Country',
    selectMethod: language === 'ar' ? 'اختر وسيلة السحب' : 'Select Gateway',
    noMethods: language === 'ar' ? 'لا تتوفر وسائل سحب حالياً' : 'No gateways available',
    amountLabel: language === 'ar' ? 'المبلغ المطلوب سحبه ($)' : 'Withdrawal Amount (USD)',
    submitBtn: language === 'ar' ? 'تأكيد طلب السحب' : 'AUTHORIZE WITHDRAWAL',
    nextBtn: language === 'ar' ? 'استمرار' : 'CONTINUE',
    success: language === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Withdrawal request submitted',
    balance: language === 'ar' ? 'الرصيد المتاح' : 'Available Balance',
    insufficient: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance',
    fillRequired: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
    fee: language === 'ar' ? 'العمولة' : 'Commission Fee',
    willReceive: language === 'ar' ? 'المبلغ الذي سيصلك' : 'You will receive',
    cryptoNotice: language === 'ar' ? 'سيصلك المبلغ الذي أدخلته مخصوماً منه 2 دولار (عمولة الشبكة)' : 'You will receive the amount you entered minus $2.00 (Network Fee)',
    localValue: language === 'ar' ? 'القيمة بالعملة المحلية' : 'Local Currency Value',
    loadingCountries: language === 'ar' ? 'جاري تحميل الدول المتاحة...' : 'Loading available countries...',
    authTitle: language === 'ar' ? 'تأكيد الأمان' : 'Security Authorization',
    confirmText: language === 'ar' ? 'هل أنت متأكد من رغبتك في سحب هذا المبلغ؟' : 'Are you sure you want to authorize this withdrawal?',
    finalConfirm: language === 'ar' ? 'تأكيد نهائي' : 'Final Confirmation',
    abort: language === 'ar' ? 'إلغاء' : 'Abort',
    verifyVault: language === 'ar' ? "تأكيد PIN الخزنة" : "Verify Vault PIN"
  };

  const handleInputChange = (label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else if (step === 3 && selectedCountry === 'CR') {
      setSelectedMethod(null);
      setStep(1);
    } else setStep(step - 1);
  };

  const handleInitiateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !profile || !selectedMethod) return;

    if (!profile?.pin) {
      toast({ variant: "destructive", title: language === 'ar' ? "يرجى إعداد PIN أولاً" : "Please setup PIN first" });
      router.push('/profile/edit');
      return;
    }

    const amountUsd = parseFloat(amount);
    if (amountUsd > (profile.balance || 0)) {
      toast({ variant: "destructive", title: t.insufficient });
      return;
    }

    const allFilled = selectedMethod.fields?.every((f: any) => formData[f.label]?.trim());
    if (!allFilled) {
      toast({ variant: "destructive", title: t.fillRequired });
      return;
    }

    setIsConfirming(true);
  };

  const handlePinAuth = () => {
    setIsConfirming(false);
    setPinEntry('');
    setIsPinVerificationOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (pinEntry !== profile?.pin) {
      toast({ variant: "destructive", title: language === 'ar' ? "رمز PIN غير صحيح" : "Incorrect PIN" });
      setPinEntry('');
      return;
    }

    if (!user || !amount || !profile || !selectedMethod) return;
    const amountUsd = parseFloat(amount);

    setLoading(true);
    try {
      let requestId = "";
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-amountUsd) });
        
        const withdrawalRef = doc(collection(db, 'withdrawals'));
        requestId = withdrawalRef.id;
        
        transaction.set(withdrawalRef, {
          userId: user.uid,
          username: profile.username,
          methodName: selectedMethod.name,
          amountUsd: amountUsd,
          localAmount: calculations.localAmount,
          currencyCode: selectedMethod.currencyCode,
          feeAmount: calculations.fee,
          netAmount: calculations.net,
          details: formData,
          status: 'pending',
          date: new Date().toISOString()
        });

        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'withdraw',
          amount: amountUsd,
          status: 'pending',
          date: new Date().toISOString()
        });
      });

      const detailsText = Object.entries(formData).map(([k, v]) => `- ${k}: <code>${v}</code>`).join('\n');
      await sendTelegramNotification(`
💸 <b>New Withdrawal Request (${selectedMethod.name})</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>USD Amount:</b> $${amount}
<b>Local Total:</b> ${calculations.localAmount} ${selectedMethod.currencyCode}
<b>Fee Applied:</b> ${calculations.fee} ${selectedMethod.currencyCode}
<b>NET TO PAY:</b> <code>${calculations.net} ${selectedMethod.currencyCode}</code>
<b>Details:</b>
${detailsText}
      `, {
        inline_keyboard: [[
          { text: "✅ Approve", callback_data: `app_wit_${requestId}` },
          { text: "❌ Reject", callback_data: `rej_wit_${requestId}` }
        ]]
      });

      toast({ title: t.success });
      router.push('/dashboard');
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERROR", description: err.message });
    } finally {
      setLoading(false);
      setIsPinVerificationOpen(false);
    }
  };

  const VirtualPad = ({ value, onChange, onComplete }: any) => {
    const handleAdd = (num: string) => { if (value.length < 4) onChange(value + num); };
    const handleClear = () => onChange(value.slice(0, -1));
    return (
      <div className="space-y-8" dir="ltr">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={cn("w-4 h-4 rounded-full border-2 transition-all duration-300", value.length > i ? "bg-primary border-primary scale-125" : "border-white/20")} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" onClick={() => handleAdd(n.toString())} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-headline font-bold hover:bg-primary hover:text-background transition-all">{n}</button>
          ))}
          <button type="button" onClick={handleClear} className="h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500 transition-all"><Delete size={24} /></button>
          <button type="button" onClick={() => handleAdd('0')} className="h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-headline font-bold hover:bg-primary hover:text-background transition-all">0</button>
          <button type="button" disabled={value.length !== 4} onClick={onComplete} className="h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary disabled:opacity-20 hover:bg-primary hover:text-background transition-all"><Check size={24} /></button>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.selectCountry}</Label>
              {initialLoading ? (
                <div className="h-14 flex items-center justify-center glass-card rounded-2xl">
                  <Loader2 className="animate-spin h-4 w-4 text-primary mr-2" />
                  <span className="text-[10px] uppercase font-headline text-muted-foreground">{t.loadingCountries}</span>
                </div>
              ) : (
                <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setStep(2); }}>
                  <SelectTrigger className="h-14 bg-card/40 border-white/10 rounded-2xl text-[10px] uppercase font-headline">
                    <SelectValue placeholder="CHOOSE LOCATION" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {availableCountries.length === 0 ? (
                      <div className="p-4 text-center text-[10px] uppercase text-muted-foreground">{t.noMethods}</div>
                    ) : availableCountries.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-[10px] uppercase font-headline">
                        {language === 'ar' ? c.ar : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedCountry && <Button onClick={() => setStep(2)} className="w-full h-14 bg-primary text-background font-headline font-black tracking-widest rounded-xl hover:scale-[1.02] transition-all gold-glow"> {t.nextBtn} </Button>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{t.selectMethod}</h2>
            <div className="grid grid-cols-1 gap-4">
              {methodsLoading ? <Loader2 className="animate-spin mx-auto text-primary" /> : filteredMethods.length === 0 ? (
                <div className="glass-card p-10 rounded-3xl text-center space-y-4">
                  <Info className="mx-auto text-muted-foreground" size={32} />
                  <p className="text-[10px] font-headline font-bold uppercase text-muted-foreground">{t.noMethods}</p>
                </div>
              ) : filteredMethods.map((m: any) => (
                <button key={m.id} onClick={() => { setSelectedMethod(m); setStep(3); }} className="glass-card p-6 rounded-3xl flex items-center justify-between border-white/5 hover:border-primary/40 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 overflow-hidden border border-white/5">
                      {m.iconUrl ? <img src={m.iconUrl} className="w-full h-full object-cover" /> : <Landmark size={24} />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-headline font-bold uppercase text-white">{m.name}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[6px] text-muted-foreground border-white/10">{m.currencyCode}</Badge>
                        <Badge className="text-[6px] bg-primary/10 text-primary border-primary/20">Rate: {m.exchangeRate}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary transition-all"><Check size={14} className="group-hover:text-background" /></div>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        const isCrypto = selectedCountry === 'CR';
        return (
          <form onSubmit={handleInitiateWithdrawal} className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isCrypto ? <Coins className="h-5 w-5 text-primary" /> : <Landmark className="h-5 w-5 text-primary" />}
                  <span className="text-[12px] font-headline font-bold uppercase text-primary">{selectedMethod.name}</span>
                </div>
                <span className="text-[8px] text-muted-foreground uppercase">{t.balance}: ${profile?.balance?.toLocaleString()}</span>
              </div>
              
              {isCrypto && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[9px] font-headline font-black text-primary uppercase tracking-widest leading-relaxed">{t.cryptoNotice}</p>
                </div>
              )}

              <Label className="text-[10px] tracking-widest font-headline uppercase block">{t.amountLabel}</Label>
              <Input type="number" placeholder="0.00" className="text-3xl font-headline font-bold h-20 text-center bg-background/50 border-white/10 rounded-xl text-primary focus:border-primary/50" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div><p className="text-[8px] text-muted-foreground uppercase">{t.localValue}</p><p className="text-sm font-headline font-bold text-white">{calculations.localAmount.toLocaleString()} {selectedMethod.currencyCode}</p></div>
                <div className="text-right"><p className="text-[8px] text-muted-foreground uppercase">{t.fee}</p><p className="text-sm font-headline font-bold text-red-500">-{calculations.fee.toLocaleString()} {selectedMethod.currencyCode}</p></div>
              </div>

              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/30 flex justify-between items-center">
                <p className="text-[10px] font-headline font-bold uppercase text-primary">{t.willReceive}</p>
                <p className="text-2xl font-headline font-black text-primary">{calculations.net.toLocaleString()} {selectedMethod.currencyCode}</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest border-b border-white/5 pb-2">REQUIRED SECURITY INTEL</p>
              {selectedMethod.fields?.map((field: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-tight text-white/60">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea placeholder={`ENTER ${field.label.toUpperCase()}`} className="bg-background/50 border-white/10 rounded-xl text-xs pt-3 min-h-[100px]" value={formData[field.label] || ''} onChange={(e) => handleInputChange(field.label, e.target.value)} required />
                  ) : field.type === 'select' ? (
                    <Select value={formData[field.label] || ''} onValueChange={(val) => handleInputChange(field.label, val)}>
                      <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl text-xs uppercase"><SelectValue placeholder={`CHOOSE ${field.label.toUpperCase()}`} /></SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        {field.options?.split(',').map((opt: string) => (
                          <SelectItem key={opt.trim()} value={opt.trim()} className="text-[10px] uppercase">{opt.trim()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder={`ENTER ${field.label.toUpperCase()}`} className="h-12 bg-background/50 border-white/10 rounded-xl text-xs" value={formData[field.label] || ''} onChange={(e) => handleInputChange(field.label, e.target.value)} required />
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" disabled={loading || !amount || calculations.net <= 0} className="w-full h-16 text-xs font-headline rounded-xl gold-glow bg-primary text-background font-black tracking-[0.2em] uppercase hover:scale-[1.02] transition-all">
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
        <button onClick={handleBack} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      {renderStep()}

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={(val) => !loading && setIsConfirming(val)}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-8 rounded-[2.5rem] z-[1000]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-primary" /> {t.authTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl text-center space-y-4">
              <p className="text-[10px] font-headline font-bold uppercase tracking-widest leading-relaxed text-white/80">
                {t.confirmText}
              </p>
              
              <div className="py-4 border-y border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-muted-foreground uppercase font-black">Requested:</span>
                  <span className="text-sm font-headline font-bold text-white">${amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] text-muted-foreground uppercase font-black">Method:</span>
                  <span className="text-[10px] font-headline font-bold text-primary">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[8px] text-muted-foreground uppercase font-black">Net Payout:</span>
                  <span className="text-2xl font-headline font-black text-primary">
                    {calculations.net.toLocaleString()} {selectedMethod?.currencyCode}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-left bg-black/20 p-3 rounded-xl">
                <p className="text-[7px] text-muted-foreground uppercase font-black">Destination Intel:</p>
                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-[7px] text-white/40 uppercase shrink-0">{k}:</span>
                    <span className="text-[8px] font-headline text-white truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handlePinAuth} 
                disabled={loading} 
                className="w-full h-14 bg-primary text-background rounded-xl font-headline text-[10px] uppercase tracking-widest font-black gold-glow flex items-center justify-center gap-2"
              >
                {t.finalConfirm} <ArrowRight size={14} />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsConfirming(false)} 
                className="w-full h-10 text-[8px] font-headline uppercase text-muted-foreground" 
                disabled={loading}
              >
                {t.abort}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Modal */}
      <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
        <DialogContent className="max-w-sm glass-card border-white/10 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> {t.verifyVault}</DialogTitle></DialogHeader>
          <div className="mt-8">
            <VirtualPad value={pinEntry} onChange={setPinEntry} onComplete={handleConfirmSubmit} />
            {loading && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
