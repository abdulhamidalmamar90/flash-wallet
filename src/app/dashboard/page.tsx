"use client"

import { useEffect, useState, useMemo, useRef } from 'react';
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
  PlusCircle,
  ArrowDown,
  Languages,
  Moon,
  Sun,
  ShieldAlert,
  QrCode,
  CheckCircle2,
  Trash2,
  Wallet,
  Send,
  X,
  Camera,
  ShoppingBag,
  Delete,
  Check,
  Fingerprint,
  Briefcase
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from "html5-qrcode";
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { language, toggleLanguage, isScannerOpen, setScannerOpen } = useStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
  
  const [recipient, setRecipient] = useState(''); 
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [mounted, setMounted] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingScanner = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !authLoading && !user) router.push('/'); }, [user, authLoading, router, mounted]);

  const userDocRef = useMemo(() => (user && db) ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  
  const transactionsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(10)) : null, [db, user?.uid]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const notificationsQuery = useMemo(() => (user && db) ? query(collection(db, 'users', user.uid, 'notifications'), orderBy('date', 'desc')) : null, [db, user?.uid]);
  const { data: notifications = [] } = useCollection(notificationsQuery);
  const unreadCount = notifications.filter((n: any) => !n.read).length;

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

  useEffect(() => {
    let isMounted = true;

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === 2) { 
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (e) {
          console.warn("Scanner cleanup warning:", e);
        } finally {
          scannerRef.current = null;
        }
      }
    };

    const startScanner = async () => {
      if (isStartingScanner.current) return;
      isStartingScanner.current = true;

      await new Promise(resolve => setTimeout(resolve, 600));
      
      if (!isMounted || !isScannerOpen) {
        isStartingScanner.current = false;
        return;
      }

      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        isStartingScanner.current = false;
        return;
      }

      try {
        await stopScanner(); 
        
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!isMounted) return;
            setRecipient(decodedText.toUpperCase());
            setScannerOpen(false);
            setIsSendModalOpen(true);
            toast({ title: language === 'ar' ? "تم التعرف على الكود" : "ID DETECTED" });
          },
          () => {} 
        );
      } catch (err) {
        console.error("Scanner start error:", err);
        if (isMounted) {
          setScannerOpen(false);
          toast({ 
            variant: "destructive", 
            title: language === 'ar' ? "خطأ في الكاميرا" : "CAMERA ERROR", 
            description: language === 'ar' ? "يرجى التحقق من صلاحيات الكاميرا" : "Please check camera permissions." 
          });
        }
      } finally {
        isStartingScanner.current = false;
      }
    };

    if (isScannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isScannerOpen, language, toast, setScannerOpen]);

  const copyId = () => {
    if (profile?.customId) {
      navigator.clipboard.writeText(profile.customId);
      toast({ title: "COPIED TO CLIPBOARD" });
    }
  };

  const handleInitiateTransfer = () => {
    if (!profile?.pin) {
      toast({ variant: "destructive", title: language === 'ar' ? "يرجى إعداد PIN أولاً" : "Please setup PIN first", description: language === 'ar' ? "اذهب إلى تعديل الحساب لتعيين رمز الأمان" : "Go to Edit Profile to set security PIN" });
      router.push('/profile/edit');
      return;
    }
    setPinEntry('');
    setIsPinVerificationOpen(true);
  };

  const handleSendMoney = async () => {
    if (pinEntry !== profile?.pin) {
      toast({ variant: "destructive", title: language === 'ar' ? "رمز PIN غير صحيح" : "Incorrect PIN" });
      setPinEntry('');
      return;
    }

    if (!user || !recipient || !sendAmount || !profile || !db) return;
    const amountNum = parseFloat(sendAmount);
    if (amountNum <= 0 || (profile.balance || 0) < amountNum) return;

    setIsSending(true);
    try {
      const q = query(collection(db, 'users'), where('customId', '==', recipient.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { setIsSending(false); return; }

      const recipientId = snap.docs[0].id;
      const recipientData = snap.docs[0].data();

      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const receiverRef = doc(db, 'users', recipientId);
        transaction.update(senderRef, { balance: increment(-amountNum) });
        transaction.update(receiverRef, { balance: increment(amountNum) });
        transaction.set(doc(collection(db, 'users', user.uid, 'transactions')), { type: 'send', amount: amountNum, recipient: recipientData.username, status: 'completed', date: new Date().toISOString() });
        transaction.set(doc(collection(db, 'users', recipientId, 'transactions')), { type: 'receive', amount: amountNum, sender: profile.username, status: 'completed', date: new Date().toISOString() });
        transaction.set(doc(collection(db, 'users', recipientId, 'notifications')), { 
          title: "Incoming Transfer", 
          message: `Success! Received $${amountNum} from @${profile.username}`, 
          type: 'transaction', 
          read: false, 
          date: new Date().toISOString() 
        });
      });

      toast({ title: "TRANSACTION SUCCESSFUL" });
      setIsPinVerificationOpen(false);
      setIsSendModalOpen(false);
      setSendAmount('');
      setRecipient('');
    } catch (e: any) { toast({ variant: "destructive", title: "FAILED" }); } finally { setIsSending(false); }
  };

  const markNotificationsAsRead = async () => {
    if (!user || !db || unreadCount === 0) return;
    notifications.forEach(async (n: any) => {
      if (!n.read) {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
      }
    });
  };

  const deleteNotification = async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
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

  if (!mounted || authLoading || (profileLoading && !profile)) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="flex justify-between items-center px-8 py-10">
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-4 group">
          <div className={cn(
            "w-14 h-14 rounded-2xl border-2 transition-all duration-500 flex items-center justify-center relative overflow-hidden",
            profile?.verified 
              ? "border-green-500 cyan-glow" 
              : "border-red-500 shadow-lg"
          )}>
            {profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <User size={24} className="text-muted-foreground" />}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-primary font-headline font-bold tracking-widest uppercase">{profile?.verified ? (language === 'ar' ? "هوية موثقة" : "Entity Verified") : (language === 'ar' ? "في انتظار التوثيق" : "Awaiting Verification")}</p>
            <p className="font-headline font-bold text-sm">@{profile?.username}</p>
          </div>
        </button>
        <button onClick={() => { setIsNotifOpen(true); markNotificationsAsRead(); }} className="relative p-2 text-muted-foreground hover:text-foreground transition-all">
          <Bell size={24} />
          {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full flex items-center justify-center border-2 border-background">{unreadCount}</span>}
        </button>
      </header>

      <main className="px-8 space-y-10">
        <section className="text-center py-10 glass-card rounded-[2.5rem] gold-glow border-primary/20">
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-headline mb-4">{language === 'ar' ? 'إجمالي الأصول' : 'Current Asset Value'}</p>
          <h1 className="text-5xl font-headline font-bold text-foreground tracking-tighter">
            ${profile?.balance?.toLocaleString()}<span className="text-xl opacity-20">.00</span>
          </h1>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full"></div>
            <span className="text-[8px] text-primary tracking-[0.2em] font-headline font-bold uppercase">Vault Secure v2.5.0</span>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <button onClick={() => setIsSendModalOpen(true)} className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-primary transition-all group">
            <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all"><Send size={20} /></div>
            <span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إرسال' : 'Send'}</span>
          </button>
          <Link href="/deposit" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-secondary transition-all group">
            <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary group-hover:text-background transition-all"><Wallet size={20} /></div>
            <span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إيداع' : 'Deposit'}</span>
          </Link>
          <Link href="/withdraw" className="flex flex-col items-center gap-2 py-4 glass-card rounded-2xl hover:border-foreground/20 transition-all group">
            <div className="p-3 rounded-xl bg-muted group-hover:bg-foreground group-hover:text-background transition-all"><ArrowDownLeft size={20} /></div>
            <span className="text-[7px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'سحب' : 'Withdraw'}</span>
          </Link>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-headline font-bold uppercase tracking-widest text-muted-foreground">{language === 'ar' ? 'سجل العمليات' : 'Recent Ledger'}</h3>
            <Link href="/transactions" className="text-[8px] font-headline text-primary hover:underline">{language === 'ar' ? 'استخراج الكل' : 'EXTRACT ALL'}</Link>
          </div>
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-5 glass-card rounded-2xl border-border/40 hover:bg-muted/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={cn("w-1 h-10 rounded-full", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "bg-red-500/40" : "bg-primary/40")} />
                  <div>
                    <p className="font-headline font-bold text-[10px] uppercase">
                      {tx.type === 'send' ? (language === 'ar' ? `تحويل إلى @${tx.recipient}` : `SENT TO @${tx.recipient}`) : 
                       tx.type === 'receive' ? (language === 'ar' ? `استلام من @${tx.sender || 'SYSTEM'}` : `RECEIVED FROM @${tx.sender || 'SYSTEM'}`) :
                       tx.type === 'withdraw' ? (language === 'ar' ? 'طلب سحب رصيد' : 'WITHDRAWAL INITIATED') :
                       tx.type === 'deposit' ? (language === 'ar' ? 'تأكيد إيداع' : 'DEPOSIT CONFIRMED') :
                       tx.type === 'refund' ? (language === 'ar' ? 'استرداد رصيد' : 'ASSET REFUNDED') :
                       `${tx.service}`}
                    </p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className={cn("font-headline font-bold text-xs", (tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? "text-foreground" : "text-primary")}>
                  {(tx.type === 'send' || tx.type === 'withdraw' || tx.type === 'purchase') ? '-' : '+'}${tx.amount}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={isScannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-4 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader>
            <DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary">
              {language === 'ar' ? 'ماسح المعرف الرقمي' : 'FLASH ID SCANNER'}
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-primary/20 cyan-glow">
            <div id="reader" className="w-full aspect-square bg-black"></div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary/50 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary/80 absolute top-1/2 -translate-y-1/2 animate-[scan_2s_infinite]"></div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-[9px] font-headline font-bold text-muted-foreground uppercase tracking-widest">
            {language === 'ar' ? 'وجه الكاميرا نحو رمز QR للمستلم' : 'POINT CAMERA AT RECIPIENT QR CODE'}
          </p>
          <button 
            onClick={() => setScannerOpen(false)} 
            className="mt-6 w-full h-12 bg-muted border border-border/40 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-all"
          >
            <X size={16} />
            <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'إلغاء' : 'CANCEL'}</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-8 rounded-[2rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center">{language === 'ar' ? 'الإعدادات والتحكم' : 'Settings & Entity Control'}</DialogTitle></DialogHeader>
          <div className="space-y-8 mt-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={cn(
                "w-20 h-20 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden shadow-xl",
                profile?.verified ? "border-green-500" : "border-red-500"
              )}>
                {profile?.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <User size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-headline font-bold tracking-tight">@{profile?.username}</h3>
                <button onClick={copyId} className="px-4 py-2 bg-muted text-[9px] font-headline font-bold uppercase tracking-widest rounded-full border border-border/40 flex items-center gap-2 hover:bg-muted/80 transition-all">
                  ID: {profile?.customId} <Copy size={12} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <ThemeToggle />
              <button onClick={() => { setIsSettingsOpen(false); setIsQrOpen(true); }} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all">
                <QrCode size={18} className="text-primary" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'المعرف الرقمي الخاص بي' : 'My Flash Identifier'}</span>
              </button>
              <Link href="/orders" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all">
                <ShoppingBag size={18} className="text-primary" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'طلباتي' : 'Asset Orders'}</span>
              </Link>
              <Link href="/profile/edit" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:border-primary transition-all">
                <Settings size={18} className="text-muted-foreground" />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'تعديل الحساب' : 'Configure Account'}</span>
              </Link>
              {profile?.role === 'admin' && (
                <Link href="/admin" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 border-primary/40 hover:bg-primary/10 transition-all">
                  <ShieldAlert size={18} className="text-primary" />
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary">{language === 'ar' ? 'لوحة التحكم (أدمن)' : 'Admin Command'}</span>
                </Link>
              )}
              {profile?.role === 'agent' && (
                <Link href="/agent" className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 border-secondary/40 hover:bg-secondary/10 transition-all">
                  <Briefcase size={18} className="text-secondary" />
                  <span className="text-[10px] font-headline font-bold uppercase tracking-widest text-secondary">{language === 'ar' ? 'لوحة الوكالة' : 'Agent Command'}</span>
                </Link>
              )}
              <button onClick={toggleLanguage} className="w-full h-14 glass-card rounded-2xl flex items-center px-6 gap-4 hover:bg-muted/20 transition-all">
                <Languages size={18} />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'اللغة: العربية' : 'Language: EN'}</span>
              </button>
              <button onClick={() => signOut(auth)} className="w-full h-14 glass-card rounded-2xl border-red-500/20 text-red-500 flex items-center px-6 gap-4 hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={18} />
                <span className="text-[10px] font-headline font-bold uppercase tracking-widest">{language === 'ar' ? 'تسجيل الخروج' : 'Terminate Access'}</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-10 text-center rounded-[2.5rem] z-[1001]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary">{language === 'ar' ? 'المعرف التشفيري' : 'Cryptographic Identifier'}</DialogTitle></DialogHeader>
          <div className="space-y-8 mt-6">
            <div className="p-6 bg-white rounded-3xl inline-block shadow-lg">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${profile?.customId}`} alt="QR" className="w-48 h-48" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-headline font-bold text-muted-foreground uppercase">{language === 'ar' ? 'معرف الكيان' : 'Entity ID'}</p>
              <p className="text-sm font-headline font-black tracking-widest text-foreground">{profile?.customId}</p>
            </div>
            <button onClick={copyId} className="w-full h-14 bg-primary text-primary-foreground font-headline font-bold rounded-2xl gold-glow hover:scale-105 transition-all">{language === 'ar' ? 'نسخ المعرف' : 'COPY FLASH ID'}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotifOpen} onOpenChange={setIsNotifOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-8 rounded-[2rem] max-h-[80vh] overflow-y-auto z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center mb-4">{language === 'ar' ? 'شريط الحماية' : 'Security Feed'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-center text-[10px] text-muted-foreground uppercase font-headline py-10">{language === 'ar' ? 'النظام خالي من التنبيهات' : 'System is clear'}</p>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className={cn("p-4 rounded-2xl border transition-all relative group", n.read ? "bg-muted/20 border-border/40" : "bg-primary/5 border-primary/20 shadow-lg")}>
                  <button onClick={() => deleteNotification(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-500"><Trash2 size={12} /></button>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-headline font-bold uppercase text-primary">{n.title}</p>
                    <p className="text-[7px] text-muted-foreground uppercase">{new Date(n.date).toLocaleTimeString()}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-10 rounded-[2.5rem] z-[1000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-center">{language === 'ar' ? 'بروتوكول التحويل السريع' : 'Fast Transfer Protocol'}</DialogTitle></DialogHeader>
          <div className="space-y-8 mt-6">
            <div className="space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder={language === 'ar' ? "معرف المستلم" : "RECIPIENT FLASH ID"} 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value.toUpperCase())} 
                  className="w-full bg-muted border border-border/40 h-14 px-6 rounded-2xl font-headline text-[10px] tracking-widest uppercase focus:border-primary outline-none transition-all" 
                />
                {isLookingUp && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
              </div>
              {recipientName && (
                <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <p className="text-[9px] font-headline font-bold text-green-500 uppercase tracking-widest">{language === 'ar' ? 'موثق:' : 'VERIFIED:'} @{recipientName}</p>
                </div>
              )}
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-headline font-bold text-primary/30">$</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={sendAmount} 
                  onChange={(e) => setSendAmount(e.target.value)} 
                  className="w-full bg-muted border border-border/40 h-20 pl-12 pr-6 rounded-2xl text-center text-3xl font-headline font-bold text-primary outline-none focus:border-primary transition-all" 
                />
              </div>
            </div>
            <button onClick={handleInitiateTransfer} disabled={isSending || !recipientName || !sendAmount} className="w-full bg-primary text-primary-foreground font-headline font-bold py-5 rounded-2xl gold-glow active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-xs">
              {isSending ? <Loader2 className="animate-spin mx-auto" /> : (language === 'ar' ? "تأكيد العملية" : "AUTHORIZE TRANSACTION")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
        <DialogContent className="max-w-sm glass-card border-border/40 p-10 text-center rounded-[2.5rem] z-[2000]">
          <DialogHeader><DialogTitle className="text-xs font-headline font-bold tracking-widest uppercase text-primary flex items-center justify-center gap-2"><Fingerprint size={16} /> {language === 'ar' ? "تأكيد PIN" : "Verify Vault PIN"}</DialogTitle></DialogHeader>
          <div className="mt-8">
            <VirtualPad value={pinEntry} onChange={setPinEntry} onComplete={handleSendMoney} />
            {isSending && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}