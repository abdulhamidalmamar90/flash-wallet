
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Loader2, Landmark, Check, Info, AlertCircle, ShieldCheck, Coins, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, doc, addDoc, query, where, increment, runTransaction } from 'firebase/firestore';
import { sendTelegramNotification } from '@/lib/telegram';
import { useStore } from '@/app/lib/store';
import { Textarea } from '@/components/ui/textarea';

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

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  useEffect(() => {
    if (profile?.country && !selectedCountry) {
      setSelectedCountry(profile.country);
    }
  }, [profile?.country, selectedCountry]);

  const methodsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'withdrawal_methods'), where('isActive', '==', true));
  }, [db]);
  
  const { data: allMethods = [], loading: methodsLoading } = useCollection(methodsQuery);

  const filteredMethods = useMemo(() => {
    return allMethods.filter((m: any) => m.country === selectedCountry || m.country === 'GL');
  }, [allMethods, selectedCountry]);

  // Logic to handle Crypto jump
  useEffect(() => {
    if (selectedCountry === 'CR' && step === 2) {
      // Define a synthetic USDT method for Crypto region
      setSelectedMethod({
        name: 'USDT',
        country: 'CR',
        fee: 2.0,
        fields: [
          { label: language === 'ar' ? 'نوع الشبكة' : 'Network Type', type: 'select', options: 'Tron (TRC20), TRX, BNB Smart Chain (BEP20)' },
          { label: language === 'ar' ? 'عنوان الشبكة' : 'Network Address', type: 'text' }
        ]
      });
      setStep(3);
    }
  }, [selectedCountry, step, language]);

  const methodFee = selectedMethod?.fee || 0;
  const amountVal = parseFloat(amount || '0');
  const totalDeduction = amountVal; // In crypto, user receives (amount - 2), so total from balance is just 'amount'
  const netAmount = Math.max(0, amountVal - methodFee);

  const t = {
    header: language === 'ar' ? 'سحب رصيد' : 'Withdraw Funds',
    selectCountry: language === 'ar' ? 'اختر الدولة' : 'Select Country',
    selectMethod: language === 'ar' ? 'اختر وسيلة السحب' : 'Select Gateway',
    noMethods: language === 'ar' ? 'لا تتوفر وسائل سحب حالياً' : 'No gateways available',
    amountLabel: language === 'ar' ? 'المبلغ المراد سحبه' : 'Withdrawal Amount',
    submitBtn: language === 'ar' ? 'تأكيد السحب' : 'AUTHORIZE WITHDRAWAL',
    nextBtn: language === 'ar' ? 'استمرار' : 'CONTINUE',
    success: language === 'ar' ? 'تم تقديم الطلب بنجاح' : 'Withdrawal request submitted',
    balance: language === 'ar' ? 'الرصيد المتاح' : 'Available Balance',
    insufficient: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance',
    fillRequired: language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
    fee: language === 'ar' ? 'العمولة' : 'Commission Fee',
    willReceive: language === 'ar' ? 'المبلغ الذي سيصلك' : 'You will receive',
    cryptoNotice: language === 'ar' ? 'سيصلك المبلغ الذي أدخلته مخصوماً منه 2 دولار (عمولة الشبكة)' : 'You will receive the amount you entered minus $2.00 (Network Fee)',
    minNotice: language === 'ar' ? 'يجب أن يكون المبلغ أكبر من 2 دولار' : 'Amount must be greater than $2.00',
  };

  const handleInputChange = (label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !profile || !selectedMethod) return;

    const amountNum = parseFloat(amount);
    if (amountNum <= methodFee) {
      toast({ variant: "destructive", title: t.minNotice });
      return;
    }

    if (amountNum > (profile.balance || 0)) {
      toast({ variant: "destructive", title: t.insufficient });
      return;
    }

    const allFilled = selectedMethod.fields?.every((f: any) => formData[f.label]?.trim());
    if (!allFilled) {
      toast({ variant: "destructive", title: t.fillRequired });
      return;
    }

    setLoading(true);
    try {
      let requestId = "";
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        transaction.update(userRef, { balance: increment(-amountNum) });
        
        const requestRef = doc(collection(db, 'withdrawals'));
        requestId = requestRef.id;
        transaction.set(requestRef, {
          userId: user.uid,
          username: profile.username,
          methodName: selectedMethod.name,
          amount: netAmount, // Record net amount to be sent
          fee: methodFee,
          details: formData,
          status: 'pending',
          date: new Date().toISOString()
        });

        const txRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(txRef, {
          type: 'withdraw',
          amount: amountNum,
          status: 'pending',
          date: new Date().toISOString()
        });
      });

      const detailsText = Object.entries(formData).map(([k, v]) => `- ${k}: <code>${v}</code>`).join('\n');
      await sendTelegramNotification(`
💸 <b>New Withdrawal Request (${selectedMethod.name})</b>
━━━━━━━━━━━━━━━━
<b>User:</b> @${profile.username}
<b>ID:</b> <code>${profile.customId}</code>
<b>Entered Amount:</b> $${amount}
<b>Net to Send:</b> $${netAmount}
<b>Fee:</b> $${methodFee}
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
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t.selectCountry}</Label>
              <Select value={selectedCountry} onValueChange={(val) => { setSelectedCountry(val); setStep(2); }}>
                <SelectTrigger className="h-14 bg-card/40 border-white/10 rounded-2xl text-[10px] uppercase font-headline">
                  <SelectValue placeholder="CHOOSE LOCATION" />
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
            {selectedCountry && <Button onClick={() => setStep(2)} className="w-full h-14 bg-primary text-background font-headline font-black tracking-widest rounded-xl"> {t.nextBtn} </Button>}
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
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110"><Landmark size={24} /></div>
                    <div className="text-left">
                      <p className="text-xs font-headline font-bold uppercase text-white">{m.name}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[6px] text-muted-foreground border-white/10">{m.country === 'GL' ? 'GLOBAL' : m.country}</Badge>
                        {m.fee > 0 && <Badge className="text-[6px] bg-primary/10 text-primary border-primary/20">Fee: ${m.fee}</Badge>}
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
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-8 border-white/5 gold-glow animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {isCrypto ? <Coins className="h-5 w-5 text-primary" /> : <Landmark className="h-5 w-5 text-primary" />}
                  <span className="text-[12px] font-headline font-bold uppercase text-primary">{selectedMethod.name} Withdrawal</span>
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
                <div><p className="text-[8px] text-muted-foreground uppercase">{t.fee}</p><p className="text-sm font-headline font-bold text-white">${methodFee}</p></div>
                <div className="text-right"><p className="text-[8px] text-muted-foreground uppercase">{t.willReceive}</p><p className="text-sm font-headline font-bold text-primary">${netAmount.toLocaleString()}</p></div>
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

            <Button type="submit" disabled={loading || !amount || parseFloat(amount) <= 2} className="w-full h-14 text-md font-headline rounded-xl gold-glow bg-primary text-background font-black tracking-widest">
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
