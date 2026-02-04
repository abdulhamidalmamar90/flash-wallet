
"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
import { useStore } from '@/app/lib/store';
import { 
  Download, 
  Bell, 
  User, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings,
  LogOut,
  Copy,
  ChevronDown,
  QrCode,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Send,
  X,
  UserCheck,
  ArrowDown,
  Moon,
  Languages,
  PlusCircle,
  Building2,
  Bitcoin,
  Star,
  Trash2,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useAuth, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, increment, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { BottomNav } from '@/components/layout/BottomNav';
import { Html5Qrcode } from 'html5-qrcode';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language } = useStore();
  
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [recipient, setRecipient] = useState(''); 
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientUid, setRecipientUid] = useState<string | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !authLoading && !user) router.push('/'); }, [user, authLoading, router, mounted]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(10)) : null, [db, user?.uid]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const notificationsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('date', 'desc')) : null, [db, user?.uid]);
  const { data: notifications = [] } = useCollection(notificationsQuery);

  const unreadCount = useMemo(() => notifications.filter((n: any) => !n.read).length, [notifications]);

  const t = {
    welcome: language === 'ar' ? 'مرحباً بك،' : 'Welcome back,',
    totalBalance: language === 'ar' ? 'الرصيد الكلي' : 'Total Balance',
    secured: language === 'ar' ? 'مؤمن ومحمي' : 'Secured & Protected',
    send: language === 'ar' ? 'إرسال' : 'Send',
    withdraw: language === 'ar' ? 'سحب' : 'Withdraw',
    deposit: language === 'ar' ? 'إيداع' : 'Deposit',
    recent: language === 'ar' ? 'آخر العمليات' : 'Recent Activity',
    notifHeader: language === 'ar' ? 'مركز التنبيهات' : 'Notification Center',
    noNotif: language === 'ar' ? 'لا توجد تنبيهات جديدة' : 'No new notifications',
    markAllRead: language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read',
    idCopied: language === 'ar' ? 'تم نسخ المعرف!' : 'ID copied!',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
  };

  const markAllAsRead = async () => {
    notifications.forEach((n: any) => {
      if (!n.read) updateDoc(doc(db, 'users', user!.uid, 'notifications', n.id), { read: true });
    });
  };

  const deleteNotification = (id: string) => {
    deleteDoc(doc(db, 'users', user!.uid, 'notifications', id));
  };

  const handleSendMoney = async () => {
    if (!user || !recipientUid || !sendAmount || !profile || !db) return;
    const amountNum = parseFloat(sendAmount);
    if (recipientUid === user.uid) return;
    if ((profile.balance || 0) < amountNum) return;
    setIsSending(true);
    try {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', recipientUid);
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });
        const senderTxRef = doc(collection(db, 'users', user.uid, 'transactions'));
        transaction.set(senderTxRef, { type: 'send', amount: amountNum, recipient: recipientName, status: 'completed', date: new Date().toISOString() });
        const receiverTxRef = doc(collection(db, 'users', recipientUid, 'transactions'));
        transaction.set(receiverTxRef, { type: 'receive', amount: amountNum, sender: profile.username, status: 'completed', date: new Date().toISOString() });
        const notifRef = doc(collection(db, 'users', recipientUid, 'notifications'));
        transaction.set(notifRef, { title: "Funds Received", message: `You received $${amountNum} from @${profile.username}`, type: 'transaction', read: false, date: new Date().toISOString() });
      });
      toast({ title: "Transfer Successful" });
      setIsSendModalOpen(false);
      setRecipient('');
      setSendAmount('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Transaction Failed", description: e.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (authLoading || (profileLoading && !profile)) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-32 relative overflow-hidden">
      <header className="flex justify-between items-center p-6 pt-8 relative z-[60]">
        <div className="relative">
          <Link href="/profile/edit" className="flex items-center gap-3 p-1 rounded-full hover:bg-muted transition-colors">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border relative">
              {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" /> : <User size={20} className="text-primary" />}
              {profile?.verified && <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 border border-primary/20 shadow-lg"><Star size={10} className="text-primary fill-primary" /></div>}
            </div>
            <div className="text-start hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.welcome}</p>
              <div className="flex items-center gap-1"><p className="font-headline font-bold text-sm">{profile?.username}</p><ChevronDown size={12} /></div>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsNotifOpen(true)} className="relative p-2 rounded-full hover:bg-muted transition-all">
            <Bell size={24} className="text-foreground/80" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-primary text-background rounded-full border-2 border-background flex items-center justify-center text-[8px] font-black">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="max-w-sm bg-card border-white/5 rounded-[2.5rem] p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-muted/30 flex justify-between items-center">
            <h3 className="font-headline font-black text-xs uppercase tracking-widest text-primary">{t.notifHeader}</h3>
            {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[8px] font-bold text-muted-foreground hover:text-primary uppercase tracking-widest">{t.markAllRead}</button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-30"><Inbox className="mx-auto h-12 w-12" /><p className="text-[10px] font-headline uppercase">{t.noNotif}</p></div>
            ) : notifications.map((n: any) => (
              <div key={n.id} className={cn("p-4 rounded-2xl border transition-all flex justify-between gap-4 group", n.read ? "bg-card/20 border-white/5" : "bg-primary/5 border-primary/20")}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", n.read ? "bg-muted-foreground" : "bg-primary animate-pulse")} />
                    <p className="font-headline font-bold text-[10px] uppercase text-foreground">{n.title}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{n.message}</p>
                  <p className="text-[7px] text-muted-foreground/30 mt-2 font-black uppercase tracking-widest">{n.date ? new Date(n.date).toLocaleTimeString() : ''}</p>
                </div>
                <button onClick={() => deleteNotification(n.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <section className="px-6 mb-8 text-center">
        <div className="relative w-full p-8 rounded-[2rem] border border-border bg-card/40 backdrop-blur-2xl shadow-xl overflow-hidden group">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] mb-4 font-bold">{t.totalBalance}</p>
          <h1 className="text-5xl font-headline font-black text-foreground mb-4 tracking-tighter">${profile?.balance?.toLocaleString() || '0'}<span className="text-2xl text-muted-foreground/20">.00</span></h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span className="text-[9px] text-secondary tracking-[0.2em] font-black uppercase">{t.secured}</span></div>
        </div>
      </section>

      <section className="px-6 grid grid-cols-3 gap-6 mb-10 relative z-10">
        <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-all"><ArrowUpRight size={28} className="text-primary-foreground" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.send}</span>
        </button>
        <Link href="/withdraw" className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-card border border-border flex items-center justify-center hover:border-secondary/30 group-hover:bg-muted transition-all"><ArrowDownLeft size={28} className="text-secondary" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.withdraw}</span>
        </Link>
        <button onClick={() => setIsDepositModalOpen(true)} className="flex flex-col items-center gap-3 group">
          <div className="w-16 h-16 rounded-[1.5rem] bg-card border border-border flex items-center justify-center group-hover:bg-muted transition-all"><ArrowDown size={28} className="text-foreground" /></div>
          <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-foreground/80">{t.deposit}</span>
        </button>
      </section>

      <section className="px-6 rounded-t-[3rem] bg-muted/30 border-t border-border min-h-[400px] backdrop-blur-md pt-10">
        <div className="flex justify-between items-center mb-8 px-2"><h3 className="text-sm font-headline font-black uppercase tracking-widest text-foreground">{t.recent}</h3></div>
        <div className="space-y-4">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", (tx.type === 'receive' || tx.type === 'deposit') ? "bg-secondary/10 text-secondary" : "bg-red-500/10 text-red-500")}>{(tx.type === 'receive' || tx.type === 'deposit') ? <Download size={20} /> : <Send size={20} />}</div>
                <div><p className="font-headline font-black text-[11px] uppercase tracking-wide">{tx.type === 'send' ? `Sent to @${tx.recipient}` : tx.type === 'receive' ? `Received from @${tx.sender}` : tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdraw' ? 'Withdrawal' : tx.service}</p><p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] mt-1">{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</p></div>
              </div>
              <p className={cn("font-headline font-black text-sm", (tx.type === 'receive' || tx.type === 'deposit') ? "text-secondary" : "text-foreground")}>{(tx.type === 'receive' || tx.type === 'deposit') ? '+' : '-'}${tx.amount}</p>
            </div>
          ))}
        </div>
      </section>

      {isSendModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSendModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-card border-t sm:border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10">
            <h2 className="text-xl font-headline font-bold text-foreground flex items-center gap-2"><Send className="text-primary" /> Quick Transfer</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Recipient Flash ID" value={recipient} onChange={(e) => setRecipient(e.target.value.toUpperCase())} className="w-full bg-muted/50 border border-border rounded-xl py-3.5 px-4 text-center font-headline tracking-widest uppercase" />
              <div className="p-4 rounded-2xl border bg-primary/5 border-primary/20 flex items-center gap-4">
                <div className="flex-1 text-xs font-headline font-bold uppercase truncate">{recipientName || 'Checking...'}</div>
              </div>
              <input type="number" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl py-5 text-center text-4xl font-headline font-black text-primary" />
            </div>
            <button onClick={handleSendMoney} disabled={isSending || !recipientUid} className="w-full bg-primary text-primary-foreground font-headline font-black py-4 rounded-xl">Authorize Transfer</button>
          </div>
        </div>
      )}

      {isDepositModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDepositModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-card border-t sm:border border-border sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10">
            <h2 className="text-xl font-headline font-bold text-foreground flex items-center gap-2"><PlusCircle className="text-secondary" /> Deposit Request</h2>
            <input type="number" placeholder="0.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl py-5 text-center text-4xl font-headline font-black text-secondary" />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => addDoc(collection(db, 'deposits'), { userId: user!.uid, username: profile!.username, amount: parseFloat(depositAmount), type: 'bank', status: 'pending', date: new Date().toISOString() }).then(() => { toast({ title: "Request Sent" }); setIsDepositModalOpen(false); })} className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col items-center gap-2"><Building2 className="text-primary" /><span>Bank</span></button>
              <button onClick={() => addDoc(collection(db, 'deposits'), { userId: user!.uid, username: profile!.username, amount: parseFloat(depositAmount), type: 'crypto', status: 'pending', date: new Date().toISOString() }).then(() => { toast({ title: "Request Sent" }); setIsDepositModalOpen(false); })} className="p-4 bg-muted/30 border border-border rounded-2xl flex flex-col items-center gap-2"><Bitcoin className="text-secondary" /><span>Crypto</span></button>
            </div>
          </div>
        </div>
      )}

      <BottomNav onScanClick={() => {}} />
    </div>
  );
}
