
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send, User, ChevronLeft, Loader2 } from 'lucide-react';
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

export default function TransferPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userDocRef);

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
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recipient || !amount || !profile || !db) return;
    
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
      // 1. Find recipient by Flash ID
      const q = query(collection(db, 'users'), where('customId', '==', recipient.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: t.errorTitle, description: t.notFound });
        setLoading(false);
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();

      // 2. Perform Atomic Transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', recipientId);
        
        // Update Balances
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });

        // Record Sender Transaction
        const senderTxRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(senderTxRef, {
          type: 'send',
          amount: amountNum,
          recipient: recipientData.username || recipient,
          status: 'completed',
          date: new Date().toISOString()
        });

        // Record Recipient Transaction
        const recipientTxRef = doc(collection(db, 'users', recipientId, 'transactions'));
        transaction.set(recipientTxRef, {
          type: 'receive',
          amount: amountNum,
          sender: profile.username,
          status: 'completed',
          date: new Date().toISOString()
        });

        // Send Notification to Recipient
        const notifRef = doc(collection(db, 'users', recipientId, 'notifications'));
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
          ? `لقد أرسلت $${amount} إلى ${recipientData.username}` 
          : `You sent $${amount} to ${recipientData.username}`,
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
            <Label htmlFor="recipient" className="text-[10px] tracking-[0.2em] font-headline uppercase block">
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
                  "h-12 bg-background/50 border-white/10 rounded-xl focus:border-secondary/50 uppercase",
                  language === 'ar' ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
                )}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[10px] tracking-[0.2em] font-headline uppercase block">
              {t.amountLabel}
            </Label>
            <Input 
              id="amount" 
              type="number" 
              placeholder="0.00" 
              className="text-2xl font-headline font-bold h-16 text-center bg-background/50 border-white/10 rounded-xl text-primary focus:border-primary/50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 text-md font-headline rounded-xl cyan-glow bg-secondary hover:bg-secondary/90 text-background font-black tracking-widest"
              disabled={loading}
            >
              {loading ? <><Loader2 className="mr-2 animate-spin" /> {t.loadingBtn}</> : t.submitBtn}
            </Button>
          </div>
        </form>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t.availableBalance}</p>
          <p className="text-xl font-headline font-black text-primary">${profile?.balance?.toLocaleString() || '0'}</p>
        </div>
      </div>
    </div>
  );
}
