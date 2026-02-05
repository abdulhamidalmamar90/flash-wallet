"use client"

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Bell, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  LogOut,
  Copy,
  Loader2,
  Send,
  PlusCircle,
  Building2,
  Bitcoin,
  ArrowDown,
  Languages,
  Moon,
  Sun,
  ShieldAlert,
  QrCode
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  runTransaction, 
  increment, 
  updateDoc, 
  deleteDoc, 
  addDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language, theme, toggleLanguage, toggleTheme } = useStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  
  const [recipient, setRecipient] = useState(''); 
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !authLoading && !user) router.push('/'); }, [user, authLoading, router, mounted]);

  useEffect(() => {
    const lookupRecipient = async () => {
      if (recipient.length >= 5 && db) {
        setIsLookingUp(true);
        try {
          const q = query(collection(db, 'users'), where('customId', '==', recipient.trim()));
          const snap = await getDocs(q);
          if (!snap.empty) setRecipientName(snap.docs[0].data().username);
          else setRecipientName(null);
        } catch (e) { setRecipientName(null); } finally { setIsLookingUp(false); }
      } else { setRecipientName(null); }
    };
    const timer = setTimeout(lookupRecipient, 500);
    return () => clearTimeout(timer);
  }, [recipient, db]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(10)) : null, [db, user?.uid]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const copyId = () => {
    if (profile?.customId) {
      navigator.clipboard.writeText(profile.customId);
      toast({ title: "COPIED" });
    }
  };

  const handleSendMoney = async () => {
    if (!user || !recipient || !sendAmount || !profile || !db) return;
    const amountNum = parseFloat(sendAmount);
    if (amountNum <= 0 || (profile.balance || 0) < amountNum) return;

    setIsSending(true);
    try {
      const q = query(collection(db, 'users'), where('customId', '==', recipient.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setIsSending(false); return; }

      const recipientDoc = snap.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();

      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', recipientId);
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });
        transaction.set(doc(collection(db, 'users', user.uid, 'transactions')), { type: 'send', amount: amountNum, recipient: recipientData.username, status: 'completed', date: new Date().toISOString() });
        transaction.set(doc(collection(db, 'users', recipientId, 'transactions')), { type: 'receive', amount: amountNum, sender: profile.username, status: 'completed', date: new Date().toISOString() });
      });

      toast({ title: "TRANSACTION AUTHORIZED" });
      setIsSendModalOpen(false);
      setSendAmount('');
      setRecipient('');
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); } finally { setIsSending(false); }
  };

  if (!mounted || authLoading || (profileLoading && !profile)) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="flex justify-between items-center px-8 py-10">
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-4 group">
          <div className={cn("w-12 h-12 border transition-all duration-500 flex items-center justify-center", profile?.verified ? "border-primary cyan-glow" : "border-border")}>
            <User size={20} className="text-muted-foreground group-hover:text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[9px] text-muted-foreground font-bold tracking-[0.2em] uppercase">Authorized Entity</p>
            <p className="font-headline font-bold text-sm tracking-tight">@{profile?.username}</p>
          </div>
        </button>
        <button className="p-2 text-muted-foreground hover:text-white transition-all"><Bell size={24} /></button>
      </header>

      <main className="px-8 space-y-12">
        <section className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-bold">Consolidated Balance</p>
          <h1 className="text-6xl font-headline font-bold text-white tracking-tighter font-financial">
            ${profile?.balance?.toLocaleString()}<span className="text-2xl opacity-20">.00</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1 border border-primary/20 bg-primary/5">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse"></div>
            <span className="text-[9px] text-primary tracking-[0.2em] font-bold uppercase">Secured v2.5.0</span>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-4 py-8 bg-card border border-border hover:border-primary transition-all">
            <ArrowUpRight size={28} className="text-primary" />
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest">Send</span>
          </button>
          <Link href="/withdraw" className="flex flex-col items-center gap-4 py-8 bg-card border border-border hover:border-secondary transition-all">
            <ArrowDownLeft size={28} className="text-secondary" />
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest">Withdraw</span>
          </Link>
          <button onClick={() => setIsDepositModalOpen(true)} className="flex flex-col items-center gap-4 py-8 bg-card border border-border hover:border-white transition-all">
            <ArrowDown size={28} className="text-muted-foreground" />
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest">Deposit</span>
          </button>
        </section>

        <section className="space-y-6 pt-8 border-t border-border">
          <h3 className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-muted-foreground">Recent Ledger Entries</h3>
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-6 bg-card border border-border hover:bg-muted transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-1 h-8", tx.type === 'send' ? "bg-red-500/20" : "bg-primary/20")} />
                  <div>
                    <p className="font-headline font-bold text-[11px] uppercase tracking-wide">
                      {tx.type === 'send' ? `DEBIT: @${tx.recipient}` : `CREDIT: @${tx.sender || 'SYSTEM'}`}
                    </p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1 font-financial">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={cn("font-headline font-bold text-sm font-financial", tx.type === 'send' ? "text-white" : "text-primary")}>
                  {tx.type === 'send' ? '-' : '+'}${tx.amount}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav onScanClick={() => setIsQrOpen(true)} />

      {/* Simplified Modals for serious feel */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm bg-card border-border p-8 rounded-none">
          <DialogHeader className="sr-only"><DialogTitle>Settings</DialogTitle></DialogHeader>
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 border border-primary flex items-center justify-center"><User size={32} className="text-primary" /></div>
              <div className="space-y-2">
                <h3 className="text-lg font-headline font-bold uppercase tracking-tight">@{profile?.username}</h3>
                <button onClick={copyId} className="px-4 py-1.5 bg-muted text-[10px] font-headline font-bold uppercase tracking-widest border border-border flex items-center gap-2">
                  ID: {profile?.customId} <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <button onClick={() => { setIsSettingsOpen(false); setIsQrOpen(true); }} className="w-full h-14 border border-border flex items-center px-6 gap-4 hover:bg-muted transition-all">
                <QrCode size={18} className="text-primary" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Flash QR</span>
              </button>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="w-full h-14 border border-border flex items-center px-6 gap-4 hover:bg-muted transition-all">
                  <ShieldAlert size={18} className="text-primary" />
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Admin Command</span>
                </Link>
              )}
              <button onClick={toggleLanguage} className="w-full h-14 border border-border flex items-center px-6 gap-4 hover:bg-muted transition-all">
                <Languages size={18} />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Language: {language === 'ar' ? 'العربية' : 'EN'}</span>
              </button>
              <button onClick={() => signOut(auth)} className="w-full h-14 border border-red-500/20 text-red-500 flex items-center px-6 gap-4 hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={18} />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Terminate Session</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-sm bg-card border-border p-10 text-center rounded-none">
          <DialogHeader className="sr-only"><DialogTitle>QR</DialogTitle></DialogHeader>
          <div className="space-y-8">
            <h3 className="font-headline font-bold text-sm uppercase tracking-widest text-primary">ENTITY QR IDENTIFIER</h3>
            <div className="p-4 bg-white mx-auto inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile?.customId}`} alt="QR" className="w-48 h-48" />
            </div>
            <p className="text-[10px] font-financial font-bold tracking-widest border-t border-border pt-4 text-muted-foreground uppercase">{profile?.customId}</p>
            <button onClick={copyId} className="w-full py-4 bg-primary text-primary-foreground font-headline font-bold text-xs uppercase tracking-widest">COPY IDENTIFIER</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-sm bg-card border-border p-10 rounded-none">
          <DialogHeader className="sr-only"><DialogTitle>Transfer</DialogTitle></DialogHeader>
          <div className="space-y-8">
            <h2 className="text-xl font-headline font-bold text-white uppercase tracking-tight">SECURE TRANSFER</h2>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="RECIPIENT FLASH ID" 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value.toUpperCase())} 
                  className="w-full bg-background border border-border h-14 px-4 text-center font-headline tracking-widest uppercase focus:border-primary outline-none" 
                />
                {isLookingUp && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
              </div>
              {recipientName && (
                <p className="text-[9px] font-headline font-bold text-primary uppercase text-center tracking-widest">RECIPIENT: @{recipientName}</p>
              )}
              <input 
                type="number" 
                placeholder="0.00" 
                value={sendAmount} 
                onChange={(e) => setSendAmount(e.target.value)} 
                className="w-full bg-background border border-border h-20 text-center text-4xl font-headline font-bold text-primary outline-none focus:border-primary font-financial" 
              />
            </div>
            <button onClick={handleSendMoney} disabled={isSending || !recipientName} className="w-full bg-primary text-primary-foreground font-headline font-bold py-5 text-xs tracking-widest disabled:opacity-50">
              {isSending ? <Loader2 className="animate-spin mx-auto" /> : "AUTHORIZE TRANSFER"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}