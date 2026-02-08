
"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send, User, ChevronLeft, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { 
  doc, 
  collection, 
  runTransaction, 
  increment, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

function TransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [recipient, setRecipient] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const urlId = searchParams.get('id');
    if (urlId) {
      setRecipient(urlId.toUpperCase());
    }
  }, [searchParams]);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

  // Real-time recipient lookup
  useEffect(() => {
    const lookup = async () => {
      if (!recipient || recipient.length < 5 || !db) {
        setFoundUser(null);
        return;
      }
      setIsChecking(true);
      try {
        const q = query(collection(db, 'users'), where('customId', '==', recipient.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setFoundUser({ id: snap.docs[0].id, ...data });
        } else {
          setFoundUser(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(lookup, 500);
    return () => clearTimeout(timer);
  }, [recipient, db]);

  const t = {
    header: language === 'ar' ? 'تحويل داخلي' : 'Internal Transfer',
    recipientLabel: language === 'ar' ? 'معرف فلاش (Flash ID)' : 'Recipient Flash ID',
    recipientPlaceholder: language === 'ar' ? 'مثال: F1234567890' : 'Ex: F1234567890',
    amountLabel: language === 'ar' ? 'المبلغ (دولار)' : 'Amount (USD)',
    availableBalance: language === 'ar' ? 'الرصيد المتاح' : 'Available balance',
    loadingBtn: language === 'ar' ? 'جاري التحقق...' : 'INITIALIZING P2P...',
    submitBtn: language === 'ar' ? 'تأكيد التحويل' : 'AUTHORIZE TRANSFER',
    successTitle: language === 'ar' ? 'تم التحويل بنجاح' : 'TRANSFER SUCCESSFUL',
    errorTitle: language === 'ar' ? 'فشلت العملية' : 'TRANSACTION FAILED',
    insufficientFunds: language === 'ar' ? 'الرصيد غير كافٍ' : 'Insufficient balance',
    notFound: language === 'ar' ? 'لم يتم العثور على الحساب' : 'Recipient Flash ID not found',
    selfTransfer: language === 'ar' ? 'لا يمكنك التحويل لنفسك' : 'Cannot transfer to yourself',
    verifying: language === 'ar' ? 'جاري التحقق من الهوية...' : 'Verifying Identity...',
    identityFound: language === 'ar' ? 'تم العثور على المستلم:' : 'Recipient identified:',
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipient || !amount || !profile || !db || !foundUser) return;
    
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) return;

    if (profile.balance < amountNum) {
      toast({ variant: "destructive", title: t.errorTitle, description: t.insufficientFunds });
      return;
    }

    if (recipient.trim() === profile.customId) {
      toast({ variant: "destructive", title: t.errorTitle, description: t.selfTransfer });
      return;
    }

    setLoading(true);
    try {
      // Perform Atomic Transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', foundUser.id);
        
        // Update Balances
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });

        // Record Sender Transaction
        const senderTxRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(senderTxRef, {
          type: 'send',
          amount: amountNum,
          recipient: foundUser.username,
          status: 'completed',
          date: new Date().toISOString()
        });

        // Record Recipient Transaction
        const recipientTxRef = doc(collection(db, 'users', foundUser.id, 'transactions'));
        transaction.set(recipientTxRef, {
          type: 'receive',
          amount: amountNum,
          sender: profile.username,
          status: 'completed',
          date: new Date().toISOString()
        });

        // Send Notification to Recipient
        const notifRef = doc(collection(db, 'users', foundUser.id, 'notifications'));
        transaction.set(notifRef, {
          title: "Funds Received",
          message: `Success! You received $${amountNum} from @${profile.username}`,
          type: 'transaction',
          read: false,
          date: new Date().toISOString()
        });
      });

      toast({
        title: t.successTitle,
        description: language === 'ar' 
          ? `لقد أرسلت $${amount} إلى ${foundUser.username}` 
          : `You sent $${amount} to ${foundUser.username}`,
      });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: "destructive", title: t.errorTitle, description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={cn(
      "max-w-lg mx-auto p-6 space-y-8 animate-in fade-in duration-500",
      language === 'ar' ? "slide-in-from-left-4" : "slide-in-from-right-4"
    )}>
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 glass-card rounded-xl hover:text-primary transition-colors">
          <ChevronLeft className={cn("h-5 w-5", language === 'ar' && "rotate-180")} />
        </button>
        <h1 className="text-lg font-headline font-bold tracking-widest uppercase">{t.header}</h1>
      </header>

      <div className="glass-card p-8 rounded-3xl space-y-8 border-white/5 cyan-glow">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30 cyan-glow">
            <Send className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-[10px] tracking-[0.2em] font-headline uppercase block px-1">
              {t.recipientLabel}
            </Label>
            <div className="relative group">
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors",
                language === 'ar' ? "right-3" : "left-3"
              )}>
                <User size={16} />
              </div>
              <Input 
                id="recipient" 
                placeholder={t.recipientPlaceholder} 
                className={cn(
                  "h-14 bg-background/50 border-white/10 rounded-2xl focus:border-secondary/50 uppercase font-headline text-sm",
                  language === 'ar' ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
            </div>

            {/* Recipient Info Display */}
            <div className="min-h-[24px] px-1 transition-all">
              {recipient && recipient.length >= 5 && !isChecking && (
                foundUser ? (
                  <div className="flex items-center gap-2 text-green-500 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest">
                      {t.identityFound} <span className="text-white">@{foundUser.username}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-top-1">
                    <XCircle size={12} />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{t.notFound}</span>
                  </div>
                )
              )}
              {recipient === profile?.customId && (
                <div className="flex items-center gap-2 text-yellow-500 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{t.selfTransfer}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[10px] tracking-[0.2em] font-headline uppercase block px-1">
              {t.amountLabel}
            </Label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-headline font-bold text-xl">$</span>
              <Input 
                id="amount" 
                type="number" 
                placeholder="0.00" 
                className="text-3xl font-headline font-bold h-20 text-center bg-background/50 border-white/10 rounded-2xl text-primary focus:border-primary/50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-16 text-xs font-headline rounded-2xl cyan-glow bg-secondary hover:bg-secondary/90 text-background font-black tracking-[0.2em] uppercase transition-all active:scale-95 disabled:opacity-50"
              disabled={loading || !foundUser || recipient === profile?.customId || isChecking}
            >
              {loading ? <><Loader2 className="mr-2 animate-spin" /> {t.loadingBtn}</> : t.submitBtn}
            </Button>
          </div>
        </form>

        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">{t.availableBalance}</p>
          <p className="text-2xl font-headline font-black text-primary">${profile?.balance?.toLocaleString() || '0'}<span className="text-sm opacity-40">.00</span></p>
        </div>
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <TransferContent />
    </Suspense>
  );
}
